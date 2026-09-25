import { NextResponse } from 'next/server';
import { platformPrisma } from '@/lib/prisma-core';
import { requireAdmin } from '@/lib/admin-auth';
import { readUserSessionId } from '@/lib/user-session';
import { resolveTenantContext } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { subscription } = data;

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: 'Missing required push subscription fields' }, { status: 400 });
    }

    // Identificar el usuario (Admin o Jugador de la sesión)
    let userId: string | null = null;
    try {
      const adminSession = await requireAdmin();
      userId = adminSession.userId;
    } catch {
      userId = await readUserSessionId();
    }

    // Si aún no hay sesión, asociar con un usuario jugador base o el primer usuario disponible
    if (!userId) {
      const fallbackUser = await platformPrisma.user.findFirst({
        where: { isActive: true },
        select: { id: true }
      });
      userId = fallbackUser?.id || null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'No active user found to attach subscription' }, { status: 400 });
    }

    // Resolver el tenant context
    let tenantId: string | null = null;
    try {
      const tenant = await resolveTenantContext();
      tenantId = tenant?.id || null;
    } catch {
      tenantId = null;
    }

    if (!tenantId) {
      const defaultTenant = await platformPrisma.tenant.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true }
      });
      tenantId = defaultTenant?.id || '';
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found for subscription' }, { status: 400 });
    }

    // Guardar o actualizar la suscripción
    await platformPrisma.pushSubscription.deleteMany({
      where: { endpoint: subscription.endpoint }
    });

    await platformPrisma.pushSubscription.create({
      data: {
        userId,
        tenantId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
