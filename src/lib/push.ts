import webpush from 'web-push';
import { platformPrisma } from '@/lib/prisma-core';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:soporte@sppadel.nanoapps.ar';

let vapidConfigured = false;
function ensureVapidConfig() {
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
      console.error('Error configurando VAPID details:', e);
      return false;
    }
  }
  return false;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  badgeCount?: number;
  tag?: string;
  icon?: string;
}

export async function sendPushToSubscription(sub: { id?: string; endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
  if (!ensureVapidConfig()) {
    console.warn('VAPID keys not configured, skipping push');
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
    tag: payload.tag || 'psp-general',
    icon: payload.icon || '/icons/icon-192x192.png',
  });

  try {
    await webpush.sendNotification(pushSub, stringified);
    return true;
  } catch (error: any) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log('Push subscription expired or unsubscribed, deleting:', sub.endpoint);
      if (sub.id) {
        await platformPrisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        await platformPrisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => {});
      }
    } else {
      console.error('Error sending single push notification:', error?.message || error);
    }
    return false;
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  try {
    const subscriptions = await platformPrisma.pushSubscription.findMany({
      where: { userId },
    });
    if (!subscriptions.length) return;

    await Promise.allSettled(
      subscriptions.map((sub: any) => sendPushToSubscription(sub, payload))
    );
  } catch (error) {
    console.error('Failed to send push to user', userId, error);
  }
}

export async function broadcastPushNotification(payload: PushPayload, filter?: { tenantId?: string; excludeUserId?: string }) {
  try {
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
    console.error('Failed to broadcast push notification:', error);
  }
}

export async function sendAdminPushNotification(title: string, body: string, url: string = '/admin/dashboard', tenantId?: string) {
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

    if (!subscriptions.length) {
      // Fallback: send to all subscriptions if no explicit admin subscription found
      return await broadcastPushNotification({ title, body, url, tag: 'psp-admin' });
    }

    await Promise.allSettled(
      subscriptions.map((sub: any) => sendPushToSubscription(sub, { title, body, url, tag: 'psp-admin' }))
    );
  } catch (error) {
    console.error('Failed to send admin push notification:', error);
  }
}

export async function broadcastLiberatedSlotPush(slot: {
  courtName: string;
  clubName: string;
  dateStr: string;
  timeStr: string;
  price?: number;
  url: string;
}) {
  const title = `⚡ ¡Turno liberado en ${slot.clubName}!`;
  const body = `${slot.courtName} disponible para hoy ${slot.dateStr} a las ${slot.timeStr}. ¡Reservalo antes de que se ocupe!`;

  await broadcastPushNotification({
    title,
    body,
    url: slot.url,
    tag: `liberated-${slot.dateStr}-${slot.timeStr}`,
  });
}

export async function broadcastOpenMatchPush(match: {
  clubName?: string;
  category?: string;
  timeStr: string;
  dateStr: string;
  missingPlayers: number;
  url: string;
}) {
  const title = `🎾 Falta ${match.missingPlayers} para partido abierto`;
  const body = `${match.category ? `Cat. ${match.category} • ` : ''}${match.dateStr} ${match.timeStr} ${match.clubName ? `en ${match.clubName}` : ''}. ¡Sumate ahora!`;

  await broadcastPushNotification({
    title,
    body,
    url: match.url,
    tag: 'open-match-alert',
  });
}
