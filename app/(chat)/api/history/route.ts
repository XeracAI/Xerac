import { auth } from '@/app/(auth)/auth';
import { getChatsByUserId } from '@/lib/db/queries';

export async function GET(request: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limit = 20; // Number of chats per page

  // biome-ignore lint: Forbidden non-null assertion.
  const chats = await getChatsByUserId({ 
    id: session.user.id!, 
    cursor: cursor ? new Date(cursor) : undefined,
    limit 
  });

  return Response.json({
    items: chats,
    nextCursor: chats.length === limit ? chats[chats.length - 1].createdAt.toISOString() : undefined
  });
}
