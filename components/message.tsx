'use client';

import { memo, useContext, useState } from 'react';
import cx from 'classnames';
import equal from 'fast-deep-equal';

import Image from 'next/image';

import { AnimatePresence, motion } from 'framer-motion';

import type { Message } from 'ai';

import type { Vote } from '@/lib/db/schema';
import { cn, checkEnglishString } from '@/lib/utils';

import { DocumentToolCall, DocumentToolResult } from './document';
import {
  PencilEditIcon,
  SparklesIcon,
  LeftArrowIcon,
  RightArrowIcon,
} from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import { ModelContext } from "@/contexts/models";

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  editMessage,
  selectSibling,
  isReadonly,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  editMessage?: (messageId: string, newContent: string) => void;
  selectSibling?: (nodeId: string, siblingId: string) => void;
  isReadonly: boolean;
}) => {
  const modelContext = useContext(ModelContext);
  const chatModels = modelContext.models;

  const [mode, setMode] = useState<'view' | 'edit'>('view');

  let model = null;
  // @ts-expect-error modelId is not defined in MessageAnnotation
  const modelId = message.annotations?.find((annotation) => annotation && annotation.modelId)?.modelId;
  if (modelId) {
    model = chatModels.find((model) => model.id === modelId);
  }

  const { siblings = [] } = message
  const siblingIndex = siblings.indexOf(message.serverId ?? message.id)

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ x: 5, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -5, opacity: 0 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              {
                model ? (
                  <>
                    <Image src={model.icon.light} alt={model.label} width={18} height={18} className="dark:hidden" />
                    <Image src={model.icon.dark} alt={model.label} width={18} height={18} className="hidden dark:block" />
                  </>
                ) : (
                  <SparklesIcon size={14} />
                )
              }
            </div>
          )}

          <div className="flex flex-col gap-4 w-full">
            {message.experimental_attachments && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.reasoning && (
              <MessageReasoning
                isLoading={isLoading}
                reasoning={message.reasoning}
              />
            )}

            {(message.content || message.reasoning) && mode === 'view' && (
              <>
                <div
                  data-testid="message-content"
                  className="flex flex-row gap-2 items-center mb-1"
                >
                  <div
                    className={cn('flex flex-col gap-4', {
                      'bg-primary text-primary-foreground px-3 py-2 rounded-tl-xl rounded-bl-xl rounded-tr-[20px] rounded-br-sm ml-auto':
                        message.role === 'user',
                    })}
                    style={{ direction: checkEnglishString(message.content) ? "ltr" : "rtl" }}
                  >
                    <Markdown>{message.content as string}</Markdown>
                  </div>

                  {message.role === 'user' && !isReadonly && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          data-testid={`message-edit`}
                          variant="ghost"
                          className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                          onClick={() => {
                            setMode('edit');
                          }}
                        >
                          <PencilEditIcon />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>ویرایش پیام</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {selectSibling !== undefined && siblings.length > 1 && (
                  <div className='flex items-center'>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className="p-1 h-fit rounded-md text-muted-foreground"
                          onClick={() => selectSibling(message.serverId ?? message.id, siblings[siblingIndex - 1])}
                          disabled={siblingIndex === 0}
                        >
                          <RightArrowIcon size={12} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>پیام قبلی</TooltipContent>
                    </Tooltip>

                    <div className="px-0.5 pt-0.5 text-xs">{siblingIndex + 1}/{siblings.length}</div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className="p-1 h-fit rounded-md text-muted-foreground"
                          onClick={() => selectSibling(message.serverId ?? message.id, siblings[siblingIndex + 1])}
                          disabled={siblingIndex === siblings.length - 1}
                        >
                          <LeftArrowIcon size={12} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>پیام بعدی</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </>
            )}

            {message.content && mode === 'edit' && editMessage !== undefined && (
              <div className="flex flex-row gap-2 items-start">
                <div className="size-8" />

                <MessageEditor
                  key={message.id}
                  message={message}
                  setMode={setMode}
                  editMessage={editMessage}
                />
              </div>
            )}

            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="flex flex-col gap-4">
                {message.toolInvocations.map((toolInvocation) => {
                  const { toolName, toolCallId, state, args } = toolInvocation;

                  if (state === 'result') {
                    const { result } = toolInvocation;

                    return (
                      <div key={toolCallId}>
                        {toolName === 'getWeather' ? (
                          <Weather weatherAtLocation={result} />
                        ) : toolName === 'createDocument' ? (
                          <DocumentPreview
                            isReadonly={isReadonly}
                            result={result}
                          />
                        ) : toolName === 'updateDocument' ? (
                          <DocumentToolResult
                            type="update"
                            result={result}
                            isReadonly={isReadonly}
                          />
                        ) : toolName === 'requestSuggestions' ? (
                          <DocumentToolResult
                            type="request-suggestions"
                            result={result}
                            isReadonly={isReadonly}
                          />
                        ) : (
                          <pre>{JSON.stringify(result, null, 2)}</pre>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather'].includes(toolName),
                      })}
                    >
                      {toolName === 'getWeather' ? (
                        <Weather />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                model={model?.label || "Loading..."}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    // TODO had to temporarily disable memoization because branch (sibling) count is not updating due to some incorrect state and memoization handling
    return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.reasoning !== nextProps.message.reasoning)
      return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (
      !equal(
        prevProps.message.toolInvocations,
        nextProps.message.toolInvocations,
      )
    )
      return false;

    if (prevProps.message.siblings?.length !== nextProps.message.siblings?.length) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full justify-center">
          <div className="flex flex-col gap-4 text-muted-foreground">
            در حال فکر کردن...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
