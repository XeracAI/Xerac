'use client';

import { updateChatVisibility } from '@/app/(chat)/chat/actions';
import { VisibilityType } from '@/components/visibility-selector';
import { useChatHistoryCache } from '@/hooks/use-chat-history-cache';
import { useMemo } from 'react';
import useSWR from 'swr';

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId: string;
  initialVisibility: VisibilityType;
}) {
  const { getChatById, updateChatInCache } = useChatHistoryCache();

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibility,
    },
  );

  const visibilityType = useMemo(() => {
    const chat = getChatById(chatId);
    if (!chat) return localVisibility;
    return chat.visibility;
  }, [getChatById, chatId, localVisibility]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    setLocalVisibility(updatedVisibilityType);
    updateChatInCache(chatId, { visibility: updatedVisibilityType });

    updateChatVisibility({
      chatId,
      visibility: updatedVisibilityType,
    });
  };

  return { visibilityType, setVisibilityType };
}
