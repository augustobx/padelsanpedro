import webpush from 'web-push';
import { platformPrisma } from '@/lib/prisma-core';
import { NanoNotificationPayload, NanoNotificationType } from './types';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:soporte@sppadel.nanoapps.ar';

let vapidConfigured = false;

function ensureVapidConfig(): boolean {
  if (vapidConfigured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || vapidPublicKey;
  const priv = process.env.VAPID_PRIVATE_KEY || vapidPrivateKey;
  const subj = process.env.NEXT_PUBLIC_VAPID_SUBJECT || vapidSubject;

  if (pub && priv) {
    try {
      webpush.setVapidDetails(subj, pub, priv);
      vapidConfigured = true;
      return true;
    } catch (e) {
      console.error('[NanoNotifications] Error configurando VAPID details:', e);
      return false;
    }
  }
  return false;
}

/**
 * Persiste la notificación en la base de datos (In-App notification center)
 */
async function recordInAppNotification(
  payload: NanoNotificationPayload,
  filter?: { tenantId?: string; userIds?: string[]; excludeUserId?: string }
) {
  try {
    let targetUserIds: string[] = [];

    if (filter?.userIds && filter.userIds.length > 0) {
      targetUserIds = filter.userIds;
    } else {
      // Para broadcast general o por tenant, seleccionar usuarios activos recientes (hasta 100)
      const users = await platformPrisma.user.findMany({
        where: {
          isActive: true,
          ...(filter?.tenantId ? { tenantId: filter.tenantId } : {}),
          ...(filter?.excludeUserId ? { id: { not: filter.excludeUserId } } : {}),
        },
        select: { id: true },
        take: 100,
        orderBy: { updatedAt: 'desc' },
      });
      targetUserIds = users.map((u) => u.id);
    }

    if (targetUserIds.length === 0) return;

    // Crear entradas de notificación para los usuarios
    const records = targetUserIds.map((userId) => ({
      tenantId: filter?.tenantId || null,
      userId,
      type: payload.type || 'SYSTEM',
      title: payload.title,
      body: payload.body,
      linkUrl: payload.url || '/',
      isRead: false,
    }));

    await platformPrisma.communityNotification.createMany({
      data: records,
    });
  } catch (err) {
    console.warn('[NanoNotifications] Warning al registrar in-app notification:', err);
  }
}

/**
 * Envía una notificación Web Push a una suscripción específica
 */
export async function sendPushToSubscription(
  sub: { id?: string; endpoint: string; p256dh: string; auth: string },
  payload: NanoNotificationPayload
): Promise<boolean> {
  if (!ensureVapidConfig()) {
    console.warn('[NanoNotifications] VAPID keys no configuradas, omitiendo push.');
    return false;
  }

  const pushSub = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  };

  const stringified = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/',
    badgeCount: payload.badgeCount ?? 1,
    tag: payload.tag || 'nano-notification',
    icon: payload.icon || '/icons/icon-192x192.png',
    data: payload.data || {},
  });

  try {
    await webpush.sendNotification(pushSub, stringified);
    return true;
  } catch (error: any) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log('[NanoNotifications] Suscripción expirada o revocada, eliminando:', sub.endpoint);
      if (sub.id) {
        await platformPrisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        await platformPrisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => {});
      }
    } else {
      console.error('[NanoNotifications] Error enviando web push:', error?.message || error);
    }
    return false;
  }
}

/**
 * Envía notificación a un usuario específico (WebPush + In-App)
 */
export async function sendPushToUser(userId: string, payload: NanoNotificationPayload, tenantId?: string) {
  try {
    // 1. Guardar en In-App center
    await recordInAppNotification(payload, { userIds: [userId], tenantId });

    // 2. Disparar WebPush a todos los navegadores/dispositivos del usuario
    const subscriptions = await platformPrisma.pushSubscription.findMany({
      where: { userId },
    });
    if (!subscriptions.length) return;

    await Promise.allSettled(
      subscriptions.map((sub: any) => sendPushToSubscription(sub, payload))
    );
  } catch (error) {
    console.error('[NanoNotifications] Error al enviar push a usuario', userId, error);
  }
}

/**
 * Emite una notificación masiva (Broadcast) a un club/tenant o a todos
 */
export async function broadcastPushNotification(
  payload: NanoNotificationPayload,
  filter?: { tenantId?: string; excludeUserId?: string }
) {
  try {
    // 1. Guardar en In-App center
    await recordInAppNotification(payload, filter);

    // 2. Disparar a todas las suscripciones Push registradas
    const where: any = {};
    if (filter?.tenantId) {
      where.tenantId = filter.tenantId;
    }
    if (filter?.excludeUserId) {
      where.userId = { not: filter.excludeUserId };
    }

    const subscriptions = await platformPrisma.pushSubscription.findMany({ where });
    if (!subscriptions.length) return;

    await Promise.allSettled(
      subscriptions.map((sub: any) => sendPushToSubscription(sub, payload))
    );
  } catch (error) {
    console.error('[NanoNotifications] Error en broadcastPushNotification:', error);
  }
}

/**
 * Notificación dirigida a Administradores (Nueva reserva, pagos, cancelaciones)
 */
export async function sendAdminPushNotification(
  title: string,
  body: string,
  url: string = '/admin/calendar',
  tenantId?: string
) {
  try {
    const where: any = {
      user: { role: 'ADMIN' },
    };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const subscriptions = await platformPrisma.pushSubscription.findMany({
      where,
      include: { user: true },
    });

    const payload: NanoNotificationPayload = {
      title,
      body,
      url,
      type: 'ADMIN_ALERT',
      tag: 'nano-admin-alert',
    };

    if (!subscriptions.length) {
      return await broadcastPushNotification(payload, { tenantId });
    }

    await Promise.allSettled(
      subscriptions.map((sub: any) => sendPushToSubscription(sub, payload))
    );
  } catch (error) {
    console.error('[NanoNotifications] Error al enviar admin push:', error);
  }
}

/**
 * Helper estandarizado: Alerta de Turno Liberado (OnlyPadel / PadelSanPedro)
 */
export async function broadcastLiberatedSlotPush(slot: {
  courtName: string;
  clubName: string;
  dateStr: string;
  timeStr: string;
  price?: number;
  url: string;
  tenantId?: string;
}) {
  const title = `⚡ ¡Turno liberado en ${slot.clubName}!`;
  const body = `${slot.courtName} disponible para hoy ${slot.dateStr} a las ${slot.timeStr}. ¡Reservalo antes de que se ocupe!`;

  await broadcastPushNotification(
    {
      title,
      body,
      url: slot.url,
      type: 'SLOT_LIBERATED',
      tag: `liberated-${slot.dateStr}-${slot.timeStr}`,
      data: {
        dateStr: slot.dateStr,
        timeStr: slot.timeStr,
        courtName: slot.courtName,
      },
    },
    { tenantId: slot.tenantId }
  );
}

/**
 * Helper estandarizado: Partido Abierto (Falta jugador)
 */
export async function broadcastOpenMatchPush(match: {
  clubName?: string;
  category?: string;
  timeStr: string;
  dateStr: string;
  missingPlayers: number;
  url: string;
  tenantId?: string;
}) {
  const title = `🎾 Falta ${match.missingPlayers} para partido abierto`;
  const body = `${match.category ? `Cat. ${match.category} • ` : ''}${match.dateStr} ${match.timeStr} ${match.clubName ? `en ${match.clubName}` : ''}. ¡Sumate ahora!`;

  await broadcastPushNotification(
    {
      title,
      body,
      url: match.url,
      type: 'MATCH_ALERT',
      tag: 'nano-open-match-alert',
    },
    { tenantId: match.tenantId }
  );
}

/**
 * Helper estandarizado: Estado de Pedido (OnlyFood)
 */
export async function sendOrderStatusPush(order: {
  userId: string;
  orderNumber: string | number;
  restaurantName: string;
  statusText: string;
  url: string;
  tenantId?: string;
}) {
  const title = `🍽️ Pedido #${order.orderNumber} - ${order.restaurantName}`;
  const body = `Tu pedido está: ${order.statusText}`;

  await sendPushToUser(
    order.userId,
    {
      title,
      body,
      url: order.url,
      type: 'ORDER_STATUS',
      tag: `order-${order.orderNumber}`,
    },
    order.tenantId
  );
}
