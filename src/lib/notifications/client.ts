'use client';

import { playChime } from './sound';
import { PlatformDevice } from './types';

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

/**
 * Detecta la plataforma y runtime del cliente
 */
export function detectPlatform(): PlatformDevice {
  if (typeof window === 'undefined') return 'UNKNOWN';

  const ua = navigator.userAgent || '';
  const isCapacitor = Boolean((window as any).Capacitor?.isNativePlatform?.());

  if (isCapacitor) {
    return /iPhone|iPad|iPod/i.test(ua) ? 'IOS_NATIVE' : 'ANDROID_NATIVE';
  }

  if (/iPad|iPhone|iPod/.test(ua)) {
    return 'WEB_SAFARI_IOS';
  }

  if (/Android/.test(ua)) {
    return /Chrome/.test(ua) ? 'WEB_CHROME' : 'WEB_OTHER';
  }

  if (/Firefox/.test(ua)) {
    return 'WEB_FIREFOX';
  }

  if (/Chrome/.test(ua)) {
    return 'WEB_CHROME';
  }

  return 'WEB_OTHER';
}

/**
 * Verifica si el dispositivo actual soporta notificaciones push
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;

  // Si corre en Capacitor Native
  if ((window as any).Capacitor?.isNativePlatform?.()) {
    return true;
  }

  // W3C Web Push (PWA y Navegadores modernos)
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Feedback háptico estándar
 */
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

/**
 * Obtiene la suscripción push existente si la hubiera
 */
export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      return await reg.pushManager.getSubscription();
    }
    return null;
  } catch (err) {
    console.warn('[NanoNotifications] Error verificando suscripción existente:', err);
    return null;
  }
}

/**
 * Suscribe al usuario a notificaciones Push en este dispositivo
 */
export async function subscribeUserToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return {
      success: false,
      error: 'Tu navegador o dispositivo no soporta notificaciones push directas.',
    };
  }

  try {
    // Si corre en Capacitor nativo
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      const PushNotifications = (window as any).Capacitor?.Plugins?.PushNotifications;
      if (PushNotifications) {
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive === 'granted') {
          await PushNotifications.register();
          triggerHaptic('success');
          playChime('success');
          return { success: true };
        }
        return { success: false, error: 'Permiso de notificaciones rechazado en el dispositivo.' };
      }
    }

    // Flujo estándar W3C WebPush (PWA en iOS Safari, Android Chrome, Escritorio)
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error:
          permission === 'denied'
            ? 'Las notificaciones están bloqueadas en los ajustes de tu navegador.'
            : 'Permiso de notificaciones no concedido.',
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

    const platform = detectPlatform();

    // Guardar la suscripción en el backend
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        platform,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Error al guardar la suscripción' };
    }

    triggerHaptic('success');
    playChime('success');
    return { success: true };
  } catch (error: any) {
    console.error('[NanoNotifications] Error al suscribir a push:', error);
    return { success: false, error: error?.message || 'Error inesperado al activar notificaciones.' };
  }
}

/**
 * Desactiva las notificaciones en este dispositivo
 */
export async function unsubscribeUserFromPush(): Promise<{ success: boolean }> {
  if (!isPushSupported()) return { success: true };
  try {
    if ('serviceWorker' in navigator) {
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
    }
    return { success: true };
  } catch (e) {
    console.error('[NanoNotifications] Error desuscribiendo de push:', e);
    return { success: false };
  }
}

export { playChime };
