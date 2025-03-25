import { cookies } from 'next/headers';

import { auth } from '@/app/(auth)/auth';

import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';

import { DEFAULT_CHAT_MODEL_ID, fetchUserModelGroups } from '@/lib/ai/models';
import { injectIconToModel } from '@/lib/ai/icons';
import { getAllAIModels, getAIModelById } from '@/lib/cache';
import { ModelContextProvider } from '@/contexts/models';
import { generateUUID } from '@/lib/utils';

export default async function Page() {
  const id = generateUUID();

  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const modelIdFromCookie = cookieStore.get('chat-model')?.value;

  const chatModels = getAllAIModels();
  const selectedModelId =
    chatModels.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_CHAT_MODEL_ID;
  const selectedModel = getAIModelById(selectedModelId);
  if (selectedModel === undefined) {
    return <div>Something went very wrong!</div>
  }

  return (
    <>
      <ModelContextProvider
        initialModels={chatModels.map(model => injectIconToModel(model))}
        initialUserModelGroups={session?.user?.id ? await fetchUserModelGroups(session.user.id) : null}
      >
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          selectedChatModel={injectIconToModel(selectedModel)}
          selectedVisibilityType="private"
          isReadonly={false}
          isNewConversation={true}
        />
      </ModelContextProvider>

      <DataStreamHandler id={id} />
    </>
  );
}
