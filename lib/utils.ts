import type {
  CoreAssistantMessage,
  CoreToolMessage,
  Message,
  ToolContent,
  ToolInvocation,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Document } from '@/lib/db/schema';
import { IMessage } from './db/mongoose-schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: IMessage;
  messages: Array<Message>;
}): Array<Message> {
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    if (message.toolInvocations) {
      for (let j = 0; j < message.toolInvocations.length; j++) {
        const toolInvocation = message.toolInvocations[j];
        const toolResult = (toolMessage.content as ToolContent).find(
          (tool) => tool.toolCallId === toolInvocation.toolCallId,
        );

        if (toolResult) {
          if (toolMessage.parent && toolMessage.parent.equals(message.id) && message.children) {
            message.children = message.children.filter(id => !toolMessage._id.equals(id));
          }

          message.toolInvocations[j] = {
            ...toolInvocation,
            state: 'result',
            result: toolResult.result,
          };
        }
      }
    }
  }
  return messages;
}

export function convertToUIMessages(
  messages: Array<IMessage>,
): Array<Message> {
  const chatMessages: Array<Message> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      addToolMessageToChat({
        toolMessage: message,
        messages: chatMessages,
      });
      continue;
    }

    let textContent = '';
    let reasoning: string | undefined = undefined;
    const toolInvocations: Array<ToolInvocation> = [];

    if (typeof message.content === 'string') {
      textContent = message.content;
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === 'text') {
          textContent += content.text;
        } else if (content.type === 'tool-call') {
          toolInvocations.push({
            state: 'call',
            toolCallId: content.toolCallId,
            toolName: content.toolName,
            args: content.args,
          });
        } else if (content.type === 'reasoning') {
          reasoning = content.reasoning;
        }
      }
    }

    const annotations = [];

    if (message.role === 'assistant') {
      annotations.push({modelId: message.modelId || 'gpt-4o-mini'});

      // Check if the parent was a tool message
      const parent = messages.find((m) => m._id.equals(message.parent))
      if (parent !== undefined && parent.role === 'tool') {
        // Find the last assistant message that made the tool calls
        const toolCallIds = (parent.content as ToolContent).map((toolCall) => toolCall.toolCallId);
        const lastAssistantMessage = messages
          .slice(0, messages.indexOf(message))
          .reverse()
          .find((m) =>
            m.role === 'assistant' &&
            Array.isArray(m.content) &&
            m.content.some(c =>
              c.type === 'tool-call' &&
              toolCallIds.includes(c.toolCallId)
            )
          );

        if (!lastAssistantMessage) {
          throw Error("Message array is incomplete!");
        }

        // Remove the tool message from new parent's children
        lastAssistantMessage.children = lastAssistantMessage.children.filter((c) => !c._id.equals(message.parent))

        // Set it as the new parent
        message.parent = lastAssistantMessage._id;

        // Add this message to the parent's children
        lastAssistantMessage.children.push(message._id);

        const lastAssistantChatMessage = chatMessages.find((m) => lastAssistantMessage._id.equals(m.id))
        if (lastAssistantChatMessage) {
          lastAssistantChatMessage.children?.push(message._id.toString());
        }
      }
    }

    chatMessages.push({
      id: message._id.toString(),
      role: message.role as Message['role'],
      content: textContent,
      reasoning,
      toolInvocations,

      annotations,

      parent: message.parent?.toString(),
      children: message.children.map((id) => id.toString()),
      siblings:
        message.parent ?
          messages.find((m) => m._id.equals(message.parent))?.children.map((id) => id.toString()) :
          messages.filter((m) => m.parent === undefined).map((m) => m._id.toString()),
    });
  }

  return chatMessages;
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function sanitizeResponseMessages({
  messages,
  reasoning,
}: {
  messages: Array<ResponseMessage>;
  reasoning: string | undefined;
}) {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text'
          ? content.text.length > 0
          : true,
    );

    if (reasoning) {
      // @ts-expect-error: reasoning message parts in sdk is wip
      sanitizedContent.push({ type: 'reasoning', reasoning });
    }

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function sanitizeUIMessages(messages: Array<Message>): Array<Message> {
  const messagesBySanitizedToolInvocations = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (!message.toolInvocations) return message;

    const toolResultIds: Array<string> = [];

    for (const toolInvocation of message.toolInvocations) {
      if (toolInvocation.state === 'result') {
        toolResultIds.push(toolInvocation.toolCallId);
      }
    }

    const sanitizedToolInvocations = message.toolInvocations.filter(
      (toolInvocation) =>
        toolInvocation.state === 'result' ||
        toolResultIds.includes(toolInvocation.toolCallId),
    );

    return {
      ...message,
      toolInvocations: sanitizedToolInvocations,
    };
  });

  return messagesBySanitizedToolInvocations.filter(
    (message) =>
      message.content.length > 0 ||
      (message.toolInvocations && message.toolInvocations.length > 0),
  );
}

export function getMostRecentUserMessage(messages: Array<CoreMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getMessageIdFromAnnotations(message: Message): string | null {
  if (!message.annotations) return null;

  // @ts-expect-error messageIdFromServer is not defined in MessageAnnotation
  const annotation = message.annotations.find((annotation) => annotation && annotation.messageIdFromServer);
  if (!annotation) return null;

  // @ts-expect-error messageIdFromServer is not defined in MessageAnnotation
  return annotation.messageIdFromServer || null;
}

export function checkEnglishString(str: string | undefined) {
  if (typeof str !== "string" || str.length === 0) {
    return false;
  }
  return /^[a-zA-Z]+$/.test(str.replace(/[\p{P}\p{N}\s<>]+/gu, "")[0]);
}
