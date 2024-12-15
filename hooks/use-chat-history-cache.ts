'use client';

import { Chat } from '@/lib/db/schema';
import { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { useCallback } from 'react';

export type PaginatedResponse = {
  items: Chat[];
  nextCursor?: string;
};

export function useChatHistoryCache() {
  const { cache, mutate: globalMutate } = useSWRConfig();

  const getAllCachedChats = useCallback(() => {
    return Array.from(cache.keys())
      .filter(key => key.startsWith('/api/history'))
      .reduce<Chat[]>((acc, key) => {
        const data = cache.get(key)?.data as PaginatedResponse | undefined;
        if (data?.items) {
          return [...acc, ...data.items];
        }
        return acc;
      }, []);
  }, [cache]);

  const getChatById = useCallback((chatId: string) => {
    return getAllCachedChats().find(chat => chat.id === chatId);
  }, [getAllCachedChats]);

  const updateChatInCache = useCallback((chatId: string, updatedChat: Partial<Chat>) => {
    const historyKeys = Array.from(cache.keys()).filter(key => key.startsWith('/api/history'));

    const chatExists = getAllCachedChats().some(chat => chat.id === chatId);
    if (!chatExists) {
        return [globalMutate<PaginatedResponse>(unstable_serialize(() => '/api/history'))];
    }

    const mutations = historyKeys.map(key => 
      globalMutate<PaginatedResponse>(
        key,
        (cached) => {
          if (!cached) return cached;

          return {
            ...cached,
            items: cached.items.map((chat) => {
              if (chat.id === chatId) {
                return {
                  ...chat,
                  ...updatedChat,
                };
              }
              return chat;
            }),
          };
        },
        { revalidate: false }
      )
    );

    return Promise.all(mutations);
  }, [cache, globalMutate, getAllCachedChats]);

  const fetchAndUpdateChat = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat?id=${chatId}`);
      const updatedChat = await response.json();
      await updateChatInCache(chatId, updatedChat);
      await globalMutate(`/api/chat?id=${chatId}`);
    } catch (error) {
      console.error('Failed to fetch and update chat:', error);
    }
  }, [updateChatInCache, globalMutate]);

  return {
    getAllCachedChats,
    getChatById,
    updateChatInCache,
    fetchAndUpdateChat,
  };
} 