import { NextResponse } from 'next/server';
import { platformPrisma } from '@/lib/prisma-core';
import { readUserSessionId } from '@/lib/user-session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json().catch(() => ({}));
    const { notificationId, markAll } = data;
    const userId = await readUserSessionId();

    if (markAll) {
      if (userId) {
        await platformPrisma.communityNotification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true },
        });
      } else {
        await platformPrisma.communityNotification.updateMany({
          where: { isRead: false },
          data: { isRead: true },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      await platformPrisma.communityNotification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Falta notificationId o markAll' }, { status: 400 });
  } catch (error: any) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ error: error?.message || 'Error updating notifications' }, { status: 500 });
  }
}
