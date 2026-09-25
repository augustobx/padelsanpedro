'use client';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'success':
        navigator.vibrate([15, 60, 20]);
        break;
      case 'warning':
        navigator.vibrate([30, 80, 40]);
        break;
    }
  } catch {
    // Silently ignore if vibrate is blocked by user policy
  }
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.warn('Error verificando suscripción Push existente:', err);
    return null;
  }
}

export async function subscribeUserToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Tu navegador o dispositivo no soporta notificaciones push.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error: permission === 'denied'
          ? 'Las notificaciones están bloqueadas en los ajustes de tu navegador.'
          : 'Permiso de notificaciones no concedido.'
      };
    }

    // Obtener la clave pública VAPID
    let publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      const res = await fetch('/api/push/public-key');
      const data = await res.json();
      publicKey = data.publicKey;
    }

    if (!publicKey) {
      return { success: false, error: 'Servicio de notificaciones no configurado en el servidor.' };
    }

    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }

    // Enviar la suscripción a nuestro backend
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Error al guardar la suscripción' };
    }

    triggerHaptic('success');
    return { success: true };
  } catch (error: any) {
    console.error('Error suscribiendo a push:', error);
    return { success: false, error: error?.message || 'Error inesperado al activar notificaciones' };
  }
}

export async function unsubscribeUserFromPush(): Promise<{ success: boolean }> {
  if (!isPushSupported()) return { success: true };
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
    return { success: true };
  } catch (e) {
    console.error('Error desuscribiendo de push:', e);
    return { success: false };
  }
}
