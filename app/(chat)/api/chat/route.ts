import {
  type Message,
  createDataStreamResponse,
  convertToCoreMessages,
  smoothStream,
  streamText,
  CoreUserMessage,
  // We don't use Vercel AI SDK generateImage, because it only handles base 64 response for now
  // experimental_generateImage as generateImage
} from 'ai';
import mongoose from 'mongoose';

import { auth } from '@/app/(auth)/auth';
import { customModel, customImageModel, generateImage } from '@/lib/ai/providers';
import { chatModels } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  addChildToMessage,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatById,
} from '@/lib/db/queries';
import {
  convertToUIMessages,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { generateTitleFromUserMessage } from '../../chat/actions';
import { IMessageInsert } from "@/lib/db/mongoose-schema";
import { constructBranchFromDBMessages, constructBranchUntilDBMessage } from '@/lib/tree';
import { isProductionEnvironment } from '@/lib/constants';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'getWeather';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const weatherTools: AllowedTools[] = ['getWeather'];

const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (!chat) {
      return new Response('Not Found', { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    return Response.json(chat);
  } catch (error) {
    console.error('Failed to get chat:', error);
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}

export async function POST(request: Request) {
  try {
    const {
      id,
      message,
      modelId,
      siblingId,
      parentId,
    }: { id: string; message: Message; modelId: string; siblingId: string | undefined; parentId: string | undefined } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized!', { status: 401 });
    }

    // Validations
    if (id === undefined) {
      return new Response('"id" is a required field!', { status: 400 });
    } else if (!uuidRegex.test(id)) {
      return new Response('Invalid UUID format!', { status: 400 });
    }
    if (message === undefined) {
      return new Response('"message" is a required field!', { status: 400 });
    }
    if (modelId === undefined) {
      return new Response('"modelId" is a required field!', { status: 400 });
    }

    const model = chatModels.find((model) => model.id === modelId);

    if (!model) {
      return new Response('Model not found!', { status: 404 });
    }

    if (message.role === undefined || message.content === undefined) {
      return new Response('No role or content found in the message!', { status: 400 });
    }
    if (message.role !== 'user') {
      return new Response('Must provide a user message!', { status: 400 });
    }

    const userCoreMessage = convertToCoreMessages([message]).at(-1) as CoreUserMessage

    const chat = await getChatById({ id });

    const userMessageId = new mongoose.Types.ObjectId();

    let coreMessages, parent;
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message: userCoreMessage });
      // TODO generate chat ID (UUID) on server
      await saveChat({ id, userId: session.user.id, title });
      coreMessages = [userCoreMessage];
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }

      const dbMessages = await getMessagesByChatId({ id });
      if (dbMessages.length === 0) { // An empty chat should never exist but just in case
        coreMessages = [userCoreMessage];
      } else {
        if (mongoose.isValidObjectId(siblingId)) {
          const leaf = dbMessages.find((dbM) => dbM._id.equals(siblingId));
          if (leaf === undefined) {
            return new Response('Invalid message ID to edit!', { status: 400 });
          }

          const branch = constructBranchUntilDBMessage(leaf, dbMessages);
          parent = leaf.parent;
          coreMessages = [...convertToCoreMessages(convertToUIMessages(branch)), userCoreMessage];
        } else {
          if (parentId === undefined) {
            return new Response('Must provide a valid parent message ID for non-empty chats!', { status: 400 });
          } else if (!mongoose.isValidObjectId(parentId)) {
            return new Response('Invalid parent message ID!', { status: 400 });
          }

          parent = dbMessages.find((m) => m._id.equals(parentId));
          if (parent === undefined) {
            return new Response('Parent message not found!', { status: 400 });
          }

          const branch = constructBranchFromDBMessages(parent, dbMessages);
          coreMessages = [...convertToCoreMessages(convertToUIMessages(branch)), userCoreMessage];
          parent = parent._id;
        }

        if (parent) {
          addChildToMessage(parent, userMessageId); // TODO catch error
        }
      }
    }

    await saveMessages({
      messages: [
        { ...userCoreMessage, _id: userMessageId, chatId: id, parent, children: [] },
      ],
    });

    switch (model.output) {
      case undefined:
      case 'text':
        return createDataStreamResponse({
          execute: (dataStream) => {
            dataStream.writeData({
              type: 'user-message-id',
              content: userMessageId.toString(),
            });

            const result = streamText({
              model: customModel(model.apiIdentifier),
              system: systemPrompt({ selectedChatModel: model.apiIdentifier }),
              messages: coreMessages,
              maxSteps: 5,
              experimental_activeTools: allTools,
              experimental_transform: smoothStream({ chunking: 'word' }),
              tools: {
                getWeather,
                createDocument: createDocument({ session, dataStream }),
                updateDocument: updateDocument({ session, dataStream }),
                requestSuggestions: requestSuggestions({
                  session,
                  dataStream,
                }),
              },
              onFinish: async ({ response, reasoning }) => {
                if (session.user?.id) {
                  try {
                    const sanitizedResponseMessages = sanitizeResponseMessages({
                      messages: response.messages,
                      reasoning,
                    });

                    let previousMessageId = userMessageId
                    await saveMessages({
                      messages: sanitizedResponseMessages.map(
                        (message) => {
                          const messageId = new mongoose.Types.ObjectId();

                          const dbMessage: IMessageInsert = {
                            _id: messageId,
                            chatId: id,
                            role: message.role,
                            content: message.content,
                            parent: previousMessageId,
                            children: [],
                          };

                          if (message.role === 'assistant') {
                            dataStream.writeMessageAnnotation({
                              messageIdFromServer: messageId.toString(),
                            });
                            dataStream.writeMessageAnnotation({ modelId });
                            dbMessage.modelId = modelId;
                          }

                          addChildToMessage(previousMessageId, messageId)
                          previousMessageId = messageId

                          return dbMessage;
                        },
                      ),
                    });
                  } catch (error) {
                    console.error('Failed to save chat', error);
                  }
                }
              },
              experimental_telemetry: {
                isEnabled: isProductionEnvironment,
                functionId: 'stream-text',
              },
            });

            result.consumeStream();

            result.mergeIntoDataStream(dataStream, {
              sendReasoning: true,
            });
          },
          onError: error => {
            // Error messages are masked by default for security reasons.
            // If you want to expose the error message to the client, you can do so here:
            return error instanceof Error ? error.message : String(error);
          },
        });
      case 'image':
        const imageData = await generateImage({ prompt: message.content, model: customImageModel(model.apiIdentifier) });

        // TODO save image in Minio and save file path in db

        try {
          await saveMessages({
            messages: [{
              chatId: id,
              role: 'assistant',
              images: [imageData],
              modelId,
              parent: userMessageId,
              children: [],
            }],
          });
        } catch (error) {
          console.error('Failed to save chat', error);
        }

        return Response.json(imageData);
    }
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { title }: { title: string } = await request.json();

    await updateChatById({ id, title });

    return new Response('Chat updated', { status: 200 });
  } catch (error) {
    return new Response(`An error occurred while processing your request: ${error}`, {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response(`An error occurred while processing your request: ${error}`, {
      status: 500,
    });
  }
}
