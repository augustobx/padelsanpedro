import { NextResponse } from 'next/server';
import { platformPrisma } from '@/lib/prisma-core';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { endpoint } = data;

    if (!endpoint) {
      return NextResponse.json({ error: 'Falta endpoint' }, { status: 400 });
    }

    await platformPrisma.pushSubscription.deleteMany({
      where: { endpoint }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
