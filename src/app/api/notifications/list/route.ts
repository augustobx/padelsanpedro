import { NextResponse } from 'next/server';
import { platformPrisma } from '@/lib/prisma-core';
import { readUserSessionId } from '@/lib/user-session';
import { resolveTenantContext } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await readUserSessionId();
    let tenantId: string | null = null;
    try {
      const tenant = await resolveTenantContext();
      tenantId = tenant?.id || null;
    } catch {
      tenantId = null;
    }

    // Buscar notificaciones dirigidas al usuario o globales del tenant
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (tenantId) {
      where.OR = [
        { tenantId },
        { tenantId: null }
      ];
    }

    const notifications = await platformPrisma.communityNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error fetching notifications list:', error);
    return NextResponse.json({ error: error?.message || 'Error fetching notifications' }, { status: 500 });
  }
}
