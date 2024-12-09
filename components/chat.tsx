'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';

import { Block, type UIBlock } from './block';
import { BlockStreamHandler } from './block-stream-handler';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { models } from "@/lib/ai/models";
import type { ImageData } from "@/lib/ai";

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();

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
    body: { id, modelId: selectedModelId },
    initialMessages,
    onFinish: () => mutate('/api/history'),
  });

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

  const handleSubmitWrapper = () => {
    const selectedModel = models.find((model) => model.id === selectedModelId)

    switch (selectedModel?.output) {
      case undefined:
      case 'text':
        handleSubmit(...arguments);
        break;
      case 'image':
        const newMessage: Message = {id: generateUUID(), role: 'user', content: input}
        setMessages((currentMessages) => [...currentMessages, newMessage])

        setInput('')

        fetch(
          '/api/chat',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
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
            reload={reload}
            votes={votes}
            isReadonly={isReadonly}
          />
        )}
      </AnimatePresence>

      <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} />
    </>
  );
}
