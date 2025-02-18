import { Message } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Overview } from './overview';
import { memo } from 'react';
import { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';

interface MessagesProps {
  chatId: string;
  isLoading: boolean;
  votes: Array<Vote> | undefined;
  messages: Array<Message>;
  editMessage?: (messageId: string, newContent: string) => void;
  changeBranch: (nodeId: string, siblingId: string) => void;
  isReadonly: boolean;
  isBlockVisible: boolean;
  selectedModelId: string;
  isNewConversation: boolean;
}

function PureMessages({
  chatId,
  isLoading,
  votes,
  messages,
  editMessage,
  changeBranch,
  isReadonly,
  selectedModelId,
  isNewConversation,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-8 flex-1 overflow-y-scroll pt-4"
    >
      {isNewConversation && <Overview selectedModelId={selectedModelId} />}

      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={isLoading && messages.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          editMessage={editMessage}
          selectSibling={changeBranch}
          isReadonly={isReadonly}
        />
      ))}

      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

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
  if (prevProps.isBlockVisible && nextProps.isBlockVisible) return true;

  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isLoading && nextProps.isLoading) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  const prevMessages = prevProps.messages
  const nextMessages = nextProps.messages
  for (let i = 0; i < prevMessages.length; ++i) {
    if (prevMessages[i].id !== nextMessages[i].id || prevMessages[i].siblings?.length !== nextMessages[i].siblings?.length) {
      return false;
    }
  }
  return equal(prevProps.votes, nextProps.votes);
});
