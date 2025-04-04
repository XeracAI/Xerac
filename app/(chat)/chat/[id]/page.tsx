import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';

import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';

import { DEFAULT_CHAT_MODEL_ID, fetchUserModelGroups } from '@/lib/ai/models';
import { injectIconToModel } from '@/lib/ai/icons';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { getAllAIModels, getAIModelById } from '@/lib/cache';
import { ModelContextProvider } from '@/contexts/models';
import { convertToUIMessages } from '@/lib/utils';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const id = (await params).id;

  // fetch data
  const chat = await getChatById({ id });

  return {
    title: `${chat.title} | زیرک`,
  };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (chat.visibility === 'private') {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model')?.value;

  const chatModels = getAllAIModels();
  const selectedModelId =
    chatModels.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_CHAT_MODEL_ID;
  const selectedModel = getAIModelById(selectedModelId);
  if (selectedModel === undefined) {
    return <div>Something went very wrong!</div>;
  }

  return (
    <>
      <ModelContextProvider
        initialModels={chatModels.map((model) => injectIconToModel(model))}
        initialUserModelGroups={
          session?.user?.id ? await fetchUserModelGroups(session.user.id) : null
        }
      >
        <Chat
          id={chat.id}
          initialMessages={convertToUIMessages(messagesFromDb)}
          selectedChatModel={injectIconToModel(selectedModel)}
          selectedVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}
        />
      </ModelContextProvider>
      <DataStreamHandler id={id} />
    </>
  );
}
