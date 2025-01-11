'use client';

import type { Attachment, ChatRequestOptions, Message } from 'ai';
import { useChat } from 'ai/react';
import { generateId } from "@ai-sdk/ui-utils";
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useWindowSize } from 'usehooks-ts';

import { ChatHeader } from '@/components/chat-header';
import type { Vote, Chat } from '@/lib/db/schema';
import { fetcher, generateUUID, getMessageIdFromAnnotations } from '@/lib/utils';

import { Block, type UIBlock } from './block';
import { BlockStreamHandler } from './block-stream-handler';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { models } from "@/lib/ai/models";
import type { ImageData } from "@/lib/ai";
import { useChatHistoryCache } from '@/hooks/use-chat-history-cache';
import { constructBranchAfterNode, constructDefaultBranchFromAIMessages, cutBranchUntilNode } from '@/lib/tree';

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  isNewConversation = false,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  isNewConversation?: boolean;
}) {
  const { fetchAndUpdateChat, getChatById } = useChatHistoryCache();

  const [allMessages, setAllMessages] = useState<Array<Message>>(initialMessages);
  const [isNewConversationState, setIsNewConversationState] = useState(isNewConversation);
  const [messageEdited, setMessageEdited] = useState<boolean>(false);

  const [currentChat, setCurrentChat] = useState<Chat>(getChatById(id) as Chat);
  const updateCurrentChat = async () => {
    const chat = await fetcher(`/api/chat?id=${id}`)
    setCurrentChat(chat)
  }

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
    data: streamingData,
  } = useChat({
    id,
    initialMessages: constructDefaultBranchFromAIMessages(initialMessages),
    onFinish: async () => {
      await fetchAndUpdateChat(id);
      await updateCurrentChat();
    },
    // @ts-expect-error JSONValue does not understand Message type
    experimental_prepareRequestBody({messages}) {
      if (messages.length === 0) {
        throw Error("Empty message array!");
      }

      const message = messages[messages.length - 1];
      let parentId, siblingId;
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
        modelId: selectedModelId,
        message: {
          role: message.role,
          content: message.content,
          toolInvocations: message.toolInvocations,
          experimental_attachments: message.experimental_attachments,
        },
        siblingId,
        parentId,
      };
    },
  });

  const changeBranch = (nodeId: string, siblingId: string) => {
    const branch = cutBranchUntilNode(nodeId, messages);
    setMessages(branch);

    const sibling = allMessages.find((m) => m.id === siblingId);
    if (!sibling) {
      throw Error("Invalid branch node!")
    }

    setTimeout(() => setMessages(constructBranchAfterNode([...branch, sibling], allMessages)), 350);
  }

  const editMessage = (messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex((m) => messageId === (m.serverId ?? m.id));
    const message = messages[messageIndex];
    if (!message) {
      throw Error("Invalid message!");
    }

    const { parent, siblings = [] } = message;
    const newId = generateId();
    const newMessage = {id: newId, serverId: message.serverId ?? message.id, role: 'user', content: newContent, parent, children: [], siblings: [...siblings, newId]} as Message;
    setMessages([...messages.slice(0, messageIndex), newMessage]);
    setAllMessages([...allMessages, newMessage]);
    setMessageEdited(true);
  }

  const { width: windowWidth = 1920, height: windowHeight = 1080 } = useWindowSize();

  const [block, setBlock] = useState<UIBlock>({
    type: 'document',
    documentId: 'init',
    content: '',
    title: '',
    status: 'idle',
    isVisible: false,
    boundingBox: {
      top: windowHeight / 4,
      left: windowWidth / 4,
      width: 250,
      height: 50,
    },
  });

  const handleSubmitWrapper = (events?: { preventDefault?: () => void }, chatRequestOptions?: ChatRequestOptions): void => {
    setIsNewConversationState(false);
    const selectedModel = models.find((model) => model.id === selectedModelId)

    switch (selectedModel?.output) {
      case undefined:
      case 'text':
        handleSubmit(events, chatRequestOptions);
        break;
      case 'image':
        const newMessage: Message = {id: generateId(), role: 'user', content: input}
        setMessages((currentMessages) => [...currentMessages, newMessage])

        setInput('')

        fetch(
          '/api/chat',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({id, modelId: selectedModelId, messages: [newMessage]})
          }
        ).then((response) => response.json()).then((responseData: ImageData) => {
          let documentId, content;
          if (responseData.url) {
            documentId = (responseData.url.split('/').pop() ?? "").split('?')[0].split('.')[0]
            content = `![alt](${responseData.url})` // TODO replace alt with generated title after it was handled
            content = responseData.url // TODO replace alt with generated title after it was handled
          } else {
            documentId = generateUUID();
            // content = `![alt](data:image/png;base64,${responseData.b64_json})`
            content = `data:image/png;base64,${responseData.b64_json}`
          }

          setBlock({
            type: 'image',
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
          })
        })
        break;
    }
  }

  useEffect(() => {
    const lastMessage = messages.at(-1);
    if (!lastMessage || lastMessage.role !== 'assistant') return;
    const assistantMessageId = getMessageIdFromAnnotations(lastMessage);
    if (assistantMessageId) {
      lastMessage.serverId = assistantMessageId;
      const lastUserMessageIndex = messages.findLastIndex((message) => message.role === 'user');
      const lastUserMessage = messages[lastUserMessageIndex];
      if (lastUserMessage.children && !lastUserMessage.children.some((s) => s === assistantMessageId)) {
        lastUserMessage.children?.push(assistantMessageId);
      }
      // setMessages(messages.map((message, index) => index === lastUserMessageIndex ? lastUserMessage : message));
    }

    const mostRecentDelta = streamingData?.at(-1);
    if (!mostRecentDelta || typeof mostRecentDelta !== 'object') return;
    // @ts-expect-error type is not defined in MessageAnnotation
    if (mostRecentDelta.type === 'user-message-id') {
      const lastUserMessageIndex = messages.findLastIndex((message) => message.role === 'user');
      const lastUserMessage = messages[lastUserMessageIndex];
      // @ts-expect-error content is not defined in JSONValue
      lastUserMessage.serverId = mostRecentDelta.content;
      lastMessage.parent = lastUserMessage.serverId;
      if (lastUserMessage.siblings && !lastUserMessage.siblings.some((s) => s === lastUserMessage.serverId)) {
        lastUserMessage.siblings[lastUserMessage.siblings.findIndex((s) => s === lastUserMessage.id)] = lastUserMessage.serverId as string;
      }
      setMessages(messages.map((message, index) => index === lastUserMessageIndex ? {
        ...message,
        // @ts-expect-error content is not defined in JSONValue
        serverId: mostRecentDelta.content,
        siblings: lastUserMessage.siblings,
      } : message));
    }
  }, [streamingData])

  useEffect(() => {
    if (messageEdited && messages[messages.length - 1].role === 'user') {
      setMessageEdited(false);
      reload();
    }
  }, [messages, messageEdited]);

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          chat={currentChat}
          selectedModelId={selectedModelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          block={block}
          setBlock={setBlock}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          editMessage={editMessage}
          changeBranch={changeBranch}
          isReadonly={isReadonly}
          isNewConversation={isNewConversationState}
          selectedModelId={selectedModelId}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmitWrapper}
              isLoading={isLoading}
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

      <AnimatePresence>
        {block?.isVisible && (
          <Block
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmitWrapper}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            append={append}
            block={block}
            setBlock={setBlock}
            messages={messages}
            setMessages={setMessages}
            editMessage={editMessage}
            changeBranch={changeBranch}
            votes={votes}
            isReadonly={isReadonly}
          />
        )}
      </AnimatePresence>

      <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} />
    </>
  );
}
