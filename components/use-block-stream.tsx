import type { JSONValue } from 'ai';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';

import type { Suggestion } from '@/lib/db/schema';

import type { UIBlock } from './block';

type StreamingDelta = {
  type:
    | 'text-delta'
    | 'title'
    | 'id'
    | 'suggestion'
    | 'clear'
    | 'finish'
    | 'user-message-id';

  content: string | Suggestion;
};

export function useBlockStream({
  streamingData,
  setBlock,
}: {
  streamingData: JSONValue[] | undefined;
  setBlock: Dispatch<SetStateAction<UIBlock>>;
}) {
  const { mutate } = useSWRConfig();
  const [optimisticSuggestions, setOptimisticSuggestions] = useState<
    Array<Suggestion>
  >([]);

  useEffect(() => {
    if (optimisticSuggestions && optimisticSuggestions.length > 0) {
      const [optimisticSuggestion] = optimisticSuggestions;
      const url = `/api/suggestions?documentId=${optimisticSuggestion.documentId}`;
      mutate(url, optimisticSuggestions, false);
    }
  }, [optimisticSuggestions, mutate]);

  useEffect(() => {
    const mostRecentDelta = streamingData?.at(-1);
    if (!mostRecentDelta) return;

    const delta = mostRecentDelta as StreamingDelta;

    if (delta.type === 'user-message-id') {
      return;
    }

    setBlock((draftBlock) => {
      switch (delta.type) {
        case 'id':
          return {
            ...draftBlock,
            type: 'document',
            documentId: delta.content as string,
          };

        case 'title':
          return {
            ...draftBlock,
            type: 'document',
            title: delta.content as string,
          };

        case 'text-delta':
          return {
            ...draftBlock,
            type: 'document',
            content: draftBlock.content + (delta.content as string),
            isVisible:
              draftBlock.status === 'streaming' &&
              draftBlock.content.length > 200 &&
              draftBlock.content.length < 250
                ? true
                : draftBlock.isVisible,
            status: 'streaming',
          };

        case 'suggestion':
          setTimeout(() => {
            setOptimisticSuggestions((currentSuggestions) => [
              ...currentSuggestions,
              delta.content as Suggestion,
            ]);
          }, 0);

          return {
            ...draftBlock,
            type: 'document',
          };

        case 'clear':
          return {
            ...draftBlock,
            type: 'document',
            content: '',
            status: 'streaming',
          };

        case 'finish':
          return {
            ...draftBlock,
            type: 'document',
            status: 'idle',
          };

        default:
          return {
            ...draftBlock,
            type: 'document',
          };
      }
    });
  }, [streamingData, setBlock]);
}
