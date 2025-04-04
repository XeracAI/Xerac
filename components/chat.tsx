'use client';

import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import type { Attachment, ChatRequestOptions, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { generateId, type TextUIPart } from '@ai-sdk/ui-utils';

import useSWR from 'swr';
import { useWindowSize } from 'usehooks-ts';

import { ChatHeader } from '@/components/chat-header';

import type { Vote, Chat as ChatSchema } from '@/lib/db/schema';
import type { Model } from '@/lib/ai/types';
import type { ImageData } from '@/lib/ai/providers';
import { fetcher, getMessageIdFromAnnotations } from '@/lib/utils';
import { constructBranchAfterNode, constructDefaultBranchFromAIMessages, cutBranchUntilNode } from '@/lib/tree';

import { useArtifact, useArtifactSelector } from '@/hooks/use-artifact';
import { useChatHistoryCache } from '@/hooks/use-chat-history-cache';

import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useSidebar } from '@/components/ui/sidebar';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
  isNewConversation = false,
}: {
  id: string;
  initialMessages: UIMessage[];
  selectedChatModel?: Model | null;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  isNewConversation?: boolean;
}) {
  const { updateChatInCache, getChatById } = useChatHistoryCache();

  const [allMessages, setAllMessages] = useState<UIMessage[]>(initialMessages);
  const [isNewConversationState, setIsNewConversationState] = useState<boolean>(isNewConversation);
  const [messageEdited, setMessageEdited] = useState<boolean>(false);

  const [currentChat, setCurrentChat] = useState<ChatSchema>(getChatById(id) as ChatSchema);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    error,
    stop,
    reload,
    data: streamingData,
  } = useChat({
    id,
    initialMessages: constructDefaultBranchFromAIMessages(initialMessages),
    experimental_throttle: 100,
    experimental_prepareRequestBody({ messages }) {
      if (messages.length === 0) {
        throw Error('Empty message array!');
      }

      if (!selectedChatModel) {
        throw Error('Invalid or no chat model selected!');
      }

      const message = messages[messages.length - 1];
      let parentId: string | undefined;
      let siblingId: string | undefined;
      if (messages.length === 1 && message.siblings?.length !== 0) {
        siblingId = message.serverId ?? message.id;
      } else if (messages.length > 1) {
        if (message.parent) {
          parentId = message.parent;
          siblingId = message.serverId ?? message.id;
        } else {
          const previousMessage = messages[messages.length - 2];
          parentId = previousMessage.serverId ?? previousMessage.id;
        }
      }

      return {
        id,
        modelId: selectedChatModel.id,
        content: (message.parts[0] as TextUIPart).text,
        attachments: message.experimental_attachments,
        siblingId,
        parentId,
      };
    },
    onError: (error) => {
      toast.error(`An error occured: ${error.message}, please try again!`);
    },
  });
  const { setArtifact } = useArtifact();
  const { updateBalance } = useSidebar();

  const changeBranch = (nodeId: string, siblingId: string) => {
    const branch = cutBranchUntilNode(nodeId, messages);
    setMessages(branch);

    const sibling = allMessages.find((m) => m.id === siblingId);
    if (!sibling) {
      throw Error('Invalid branch node!');
    }

    setTimeout(() => setMessages(constructBranchAfterNode([...branch, sibling], allMessages)), 350);
  };

  const editMessage = (messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex((m) => messageId === (m.serverId ?? m.id));
    const message = messages[messageIndex];
    if (!message) {
      throw Error('Invalid message!');
    }

    const { parent, siblings = [] } = message;
    const newId = generateId();
    const newMessage: UIMessage = {
      id: newId,
      serverId: message.serverId ?? message.id,
      role: 'user',
      content: '',
      parts: [{ type: 'text', text: newContent }],
      parent,
      children: [],
      siblings: [...siblings, newId],
    };
    setMessages([...messages.slice(0, messageIndex), newMessage]);
    setAllMessages([...allMessages, newMessage]);
    setMessageEdited(true);
  };

  const { width: windowWidth = 1920, height: windowHeight = 1080 } = useWindowSize();

  const handleSubmitWrapper = (events?: { preventDefault?: () => void }, chatRequestOptions?: ChatRequestOptions): void => {
    setIsNewConversationState(false);

    if (!selectedChatModel) {
      return;
    }

    if (selectedChatModel.outputTypes.includes('Image')) {
      const newMessage: UIMessage = {
        id: generateId(),
        role: 'user',
        parts: [{ type: 'text', text: input }],
        content: '',
      };
      setMessages((currentMessages) => [...currentMessages, newMessage]);

      setInput('');

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          modelId: selectedChatModel,
          messages: [newMessage],
        }),
      })
        .then((response) => response.json())
        .then((responseData: ImageData) => {
          let documentId: string;
          let content: string;
          if (responseData.url) {
            documentId = (responseData.url.split('/').pop() ?? '').split('?')[0].split('.')[0];
            content = `![alt](${responseData.url})`; // TODO replace alt with generated title after it was handled
            content = responseData.url; // TODO replace alt with generated title after it was handled
          } else {
            documentId = crypto.randomUUID();
            // content = `![alt](data:image/png;base64,${responseData.b64_json})`
            content = `data:image/png;base64,${responseData.b64_json}`;
          }

          setArtifact({
            kind: 'image',
            documentId,
            content,
            title: '', // TODO replace with generated title after it was handled
            status: 'idle',
            isVisible: true,
            boundingBox: {
              top: windowHeight / 4,
              left: windowWidth / 4,
              width: 250,
              height: 50,
            },
          });
        });
    } else {
      handleSubmit(events, chatRequestOptions);
    }
  };

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;
    const assistantMessageId = getMessageIdFromAnnotations(lastMessage);
    if (assistantMessageId) {
      lastMessage.serverId = assistantMessageId;
      const lastUserMessageIndex = messages.findLastIndex((message) => message.role === 'user');
      const lastUserMessage = messages[lastUserMessageIndex];
      if (lastUserMessage.children && !lastUserMessage.children.some((s) => s === assistantMessageId)) {
        lastUserMessage.children?.push(assistantMessageId);
      }
    }

    const mostRecentDelta = streamingData?.at(-1);
    if (!mostRecentDelta || typeof mostRecentDelta !== 'object') return;
    // @ts-expect-error type is not defined in MessageAnnotation
    switch (mostRecentDelta.type) {
      case 'user-message-id': {
        const lastUserMessageIndex = messages.findLastIndex((message) => message.role === 'user');
        const lastUserMessage = messages[lastUserMessageIndex];
        // @ts-expect-error content is not defined in JSONValue
        lastUserMessage.serverId = mostRecentDelta.content;
        lastMessage.parent = lastUserMessage.serverId;
        if (lastUserMessage.siblings && !lastUserMessage.siblings.some((s) => s === lastUserMessage.serverId)) {
          lastUserMessage.siblings[lastUserMessage.siblings.findIndex((s) => s === lastUserMessage.id)] =
            lastUserMessage.serverId as string;
        }
        setMessages(
          messages.map((message, index) =>
            index === lastUserMessageIndex
              ? {
                  ...message,
                  // @ts-expect-error content is not defined in JSONValue
                  serverId: mostRecentDelta.content,
                  siblings: lastUserMessage.siblings,
                }
              : message,
          ),
        );
        break;
      }
      case 'chat-title': {
        // @ts-expect-error content is not defined in JSONValue
        const title = mostRecentDelta.content;
        setCurrentChat({ ...currentChat, title });
        updateChatInCache(id, { title });
        break;
      }
      case 'message-cost': {
        if (!lastMessage.cost) {
          // @ts-expect-error content is not defined in JSONValue
          const totalCost = mostRecentDelta.content;
          // FIXME this is called multiple times and I don't know why
          updateBalance(-totalCost);
          setMessages([...messages.slice(0, messages.length - 1), { ...lastMessage, cost: totalCost }]);
        }
        break;
      }
    }
  }, [streamingData]);

  useEffect(() => {
    if (messageEdited && messages[messages.length - 1].role === 'user') {
      setMessageEdited(false);
      reload();
    }
  }, [messages, messageEdited]);

  const { data: votes } = useSWR<Vote[]>(messages.length >= 2 ? `/api/vote?chatId=${id}` : null, fetcher);

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          chat={currentChat}
          selectedModel={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          error={error}
          messages={messages}
          editMessage={editMessage}
          changeBranch={changeBranch}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
          isNewConversation={isNewConversationState}
          selectedModel={selectedChatModel}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmitWrapper}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmitWrapper}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        editMessage={editMessage}
        changeBranch={changeBranch}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
