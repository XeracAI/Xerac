import type { Message } from 'ai';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote, VoteInsert } from '@/lib/db/schema';
import { getMessageIdFromAnnotations } from '@/lib/utils';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { memo } from 'react';
import equal from 'fast-deep-equal';

export function PureMessageActions({
  chatId,
  message,
  vote,
  model,
  isLoading,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  model: string;
  isLoading: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [, copyToClipboard] = useCopyToClipboard();

  if (isLoading) return null;
  if (message.role === 'user') return null;
  if (message.toolInvocations && message.toolInvocations.length > 0) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground"
              variant="outline"
              onClick={async () => {
                await copyToClipboard(message.content as string);
                toast.success('Copied to clipboard!');
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>کپی</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              disabled={vote?.isUpvoted}
              variant="outline"
              onClick={async () => {
                let messageId = getMessageIdFromAnnotations(message);
                if (messageId === null) messageId = message.serverId ?? message.id;

                const upvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId,
                    type: 'up',
                  }),
                });

                toast.promise(upvote, {
                  loading: 'در حال ثبت...',
                  success: () => {
                    mutate<Array<VoteInsert>>(
                      `/api/vote?chatId=${chatId}`,
                      (currentVotes) => {
                        if (!currentVotes) return [];

                        const votesWithoutCurrent = currentVotes.filter(
                          (vote) => vote.messageId !== messageId,
                        );

                        return [
                          ...votesWithoutCurrent,
                          {
                            chatId,
                            messageId: messageId,
                            isUpvoted: true,
                          },
                        ];
                      },
                      { revalidate: false },
                    );

                    return 'نظر شما ثبت شد!';
                  },
                  error: 'خطایی در ثبت نظر رخ داد.',
                });
              }}
            >
              <ThumbUpIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>پاسخ خوب</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              variant="outline"
              disabled={vote && !vote.isUpvoted}
              onClick={async () => {
                let messageId = getMessageIdFromAnnotations(message);
                if (messageId === null) messageId = message.serverId ?? message.id;

                const downvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId,
                    type: 'down',
                  }),
                });

                toast.promise(downvote, {
                  loading: 'در حال ثبت...',
                  success: () => {
                    mutate<Array<VoteInsert>>(
                      `/api/vote?chatId=${chatId}`,
                      (currentVotes) => {
                        if (!currentVotes) return [];

                        const votesWithoutCurrent = currentVotes.filter(
                          (vote) => vote.messageId !== messageId,
                        );

                        return [
                          ...votesWithoutCurrent,
                          {
                            chatId,
                            messageId: messageId,
                            isUpvoted: false,
                          },
                        ];
                      },
                      { revalidate: false },
                    );

                    return 'نظر شما ثبت شد!';
                  },
                  error: 'خطایی در ثبت نظر رخ داد.',
                });
              }}
            >
              <ThumbDownIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>پاسخ بد</TooltipContent>
        </Tooltip>

        <div className="text-xs mr-2 text-muted-foreground">{model}</div>
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    return prevProps.isLoading === nextProps.isLoading;
  },
);
