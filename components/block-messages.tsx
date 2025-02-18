import { PreviewMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Vote } from '@/lib/db/schema';
import { ChatRequestOptions, Message } from 'ai';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { UIBlock } from './block';

interface BlockMessagesProps {
  chatId: string;
  isLoading: boolean;
  votes: Array<Vote> | undefined;
  messages: Array<Message>;
  editMessage?: (messageId: string, newContent: string) => void;
  changeBranch: (nodeId: string, siblingId: string) => void;
  isReadonly: boolean;
  blockStatus: UIBlock['status'];
}

function PureBlockMessages({
  chatId,
  isLoading,
  votes,
  messages,
  editMessage,
  changeBranch,
  isReadonly,
}: BlockMessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col gap-4 h-full items-center overflow-y-scroll px-4 pt-20"
    >
      {messages.map((message, index) => (
        <PreviewMessage
          chatId={chatId}
          key={message.id}
          message={message}
          isLoading={isLoading && index === messages.length - 1}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === (message.serverId ?? message.id))
              : undefined
          }
          editMessage={editMessage}
          selectSibling={changeBranch}
          isReadonly={isReadonly}
        />
      ))}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

function areEqual(
  prevProps: BlockMessagesProps,
  nextProps: BlockMessagesProps,
) {
  if (
    prevProps.blockStatus === 'streaming' &&
    nextProps.blockStatus === 'streaming'
  )
    return true;

  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isLoading && nextProps.isLoading) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
}

export const BlockMessages = memo(PureBlockMessages, areEqual);
