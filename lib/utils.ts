import type {
  Message,
  UIMessage,
  ToolContent,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Document } from '@/lib/db/schema';
import type { IMessage } from './db/mongoose-schema';

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

export function convertToUIMessages(
  messages: IMessage[],
): UIMessage[] {
  const chatMessages: UIMessage[] = [];

  for (const message of messages) {
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
      role: message.role as UIMessage['role'],
      parts: message.parts as UIMessage['parts'],
      content: '',

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
