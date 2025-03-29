import { NextResponse } from 'next/server';

import {
  appendResponseMessages,
  createDataStreamResponse,
  convertToCoreMessages,
  smoothStream,
  streamText,
  type CoreMessage,
  type CoreUserMessage,
  type Message,
  // We don't use Vercel AI SDK generateImage, because it only handles base 64 response for now
  // experimental_generateImage as generateImage
} from 'ai';
import type { Attachment } from "@ai-sdk/ui-utils";
import mongoose from 'mongoose';

import { auth } from '@/app/(auth)/auth';

import { getChatModel, getImageModel, generateImage } from '@/lib/ai/providers';
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
import { convertToUIMessages } from '@/lib/utils';

import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';

import { constructBranchFromDBMessages, constructBranchUntilDBMessage } from '@/lib/tree';
import { isProductionEnvironment } from '@/lib/constants';
import { getAIModelById } from '@/lib/cache';

import { generateTitleFromUserMessage } from '../../chat/actions';

interface POSTRouteBody {
  id: string;
  content: string;
  attachments: Attachment[];
  modelId: string;
  siblingId: string | undefined;
  parentId: string | undefined;
}

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
      content,
      attachments,
      modelId,
      siblingId,
      parentId,
    }: POSTRouteBody = await request.json();

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
    if (content === undefined) {
      return new Response('"content" is a required field!', { status: 400 });
    }
    if (modelId === undefined) {
      return new Response('"modelId" is a required field!', { status: 400 });
    }

    const model = getAIModelById(modelId);

    if (!model) {
      return new Response('Model not found!', { status: 404 });
    }

    const userMessage = { role: 'user', content, experimental_attachments: attachments } as Message;
    const userCoreMessage = convertToCoreMessages([userMessage]).at(-1) as CoreUserMessage;

    const chat = await getChatById({ id });

    const userMessageId = new mongoose.Types.ObjectId();

    let messages: CoreMessage[], parent, title: string | undefined;
    if (!chat) {
      title = await generateTitleFromUserMessage({ message: userCoreMessage });
      await saveChat({ id, userId: session.user.id, title });
      messages = [userCoreMessage];
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }

      const dbMessages = await getMessagesByChatId({ id });
      if (dbMessages.length === 0) { // An empty chat should never exist but just in case
        messages = [userCoreMessage];
      } else {
        if (mongoose.isValidObjectId(siblingId)) {
          const leaf = dbMessages.find((dbM) => dbM._id.equals(siblingId));
          if (leaf === undefined) {
            return new Response('Invalid message ID to edit!', { status: 400 });
          }

          const branch = constructBranchUntilDBMessage(leaf, dbMessages);
          parent = leaf.parent;
          messages = [...convertToCoreMessages(convertToUIMessages(branch)), userCoreMessage];
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
          messages = [...convertToCoreMessages(convertToUIMessages(branch)), userCoreMessage];
          parent = parent._id;
        }

        if (parent) {
          addChildToMessage(parent, userMessageId); // TODO catch error
        }
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          _id: userMessageId,
          role: 'user',
          parts: [{ type: 'text', text: content }],
          attachments: attachments ?? [],
          parent,
          children: [],
        },
      ],
    });

    if (model.outputTypes.includes('Image')) {
      const imageData = await generateImage({ prompt: content, model: getImageModel(model.provider, model.apiIdentifier) });

      // TODO save image in Minio and save file path in db

      try {
        await saveMessages({
          messages: [{
            chatId: id,
            role: 'assistant',
            images: [imageData],
            attachments: [],
            modelId,
            parent: userMessageId,
            children: [],
          }],
        });
      } catch (error) {
        console.error('Failed to save chat', error);
      }

      return Response.json(imageData);
    } else {
      return createDataStreamResponse({
        execute: (dataStream) => {
          if (title) {
            dataStream.writeData({
              type: 'chat-title',
              content: title
            });
          }
          dataStream.writeData({
            type: 'user-message-id',
            content: userMessageId.toString(),
          });

          const result = streamText({
            model: getChatModel(model.provider, model.apiIdentifier),
            system: systemPrompt({ selectedChatModel: model.apiIdentifier }),
            messages,
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
            onFinish: async ({ response }) => {
              if (session.user?.id) {
                try {
                  const assistantMessages = response.messages.filter(
                    (message) => message.role === 'assistant',
                  )

                  if (assistantMessages.length === 0) {
                    throw new Error('No assistant message found!');
                  }

                  const [, assistantMessage] = appendResponseMessages({
                    messages: [{ ...userMessage, id }],
                    responseMessages: response.messages,
                  });

                  const assistantMessageId = new mongoose.Types.ObjectId();
                  await saveMessages({
                    messages: [
                      {
                        _id: assistantMessageId,
                        chatId: id,
                        role: 'assistant',
                        parts: assistantMessage.parts,
                        attachments: assistantMessage.experimental_attachments ?? [],

                        modelId,

                        parent: userMessageId,
                        children: [],
                      }
                    ]
                  });
                  dataStream.writeMessageAnnotation({
                    messageIdFromServer: assistantMessageId.toString(),
                  });
                  dataStream.writeMessageAnnotation({ modelId });
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
    }
  } catch (error) {
    console.log("HERE", typeof error, error);
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
