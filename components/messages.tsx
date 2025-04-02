import { memo } from 'react';
import equal from 'fast-deep-equal';

import type { UIMessage } from 'ai';
import type { UseChatHelpers } from '@ai-sdk/react';

import type { Vote } from '@/lib/db/schema';
import type { Model } from '@/lib/ai/types';

import { PreviewMessage, ThinkingMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Overview } from './overview';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  editMessage?: (messageId: string, newContent: string) => void;
  changeBranch: (nodeId: string, siblingId: string) => void;
  isReadonly: boolean;
  isArtifactVisible: boolean;
  selectedModel?: Model | null;
  isNewConversation: boolean;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  editMessage,
  changeBranch,
  isReadonly,
  selectedModel,
  isNewConversation,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();

  return (
    <div ref={messagesContainerRef} className="flex flex-col min-w-0 gap-8 flex-1 overflow-y-scroll pt-4">
      {isNewConversation && <Overview selectedModel={selectedModel} />}

      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={status === 'streaming' && messages.length - 1 === index}
          vote={votes ? votes.find((vote) => vote.messageId === message.id) : undefined}
          editMessage={editMessage}
          selectSibling={changeBranch}
          isReadonly={isReadonly}
        />
      ))}

      {status === 'submitted' && messages.length > 0 && messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  // TODO had to temporarily disable memoization because branch (sibling) count is not updating due to some incorrect state and memoization handling
  return false;
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  const prevMessages = prevProps.messages;
  const nextMessages = nextProps.messages;
  for (let i = 0; i < prevMessages.length; ++i) {
    if (prevMessages[i].id !== nextMessages[i].id || prevMessages[i].siblings?.length !== nextMessages[i].siblings?.length) {
      return false;
    }
  }
  return equal(prevProps.votes, nextProps.votes);
});
