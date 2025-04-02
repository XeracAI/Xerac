import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';
import { getUserBalance } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    const balance = await getUserBalance(session.user.id);

    if (!balance) {
      return NextResponse.json({ status: 'error', message: 'User not found' }, { status: 400 });
    }

    return NextResponse.json({ balance });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: `Failed to get balance: ${error}` }, { status: 400 });
  }
}
