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
 * Helper dinámico para obtener el plugin de PushNotifications de Capacitor
 */
async function getCapacitorPush() {
  if (typeof window === 'undefined') return null;
  const isCapacitor = Boolean((window as any).Capacitor?.isNativePlatform?.());
  if (!isCapacitor) return null;

  try {
    // @ts-ignore
    const { PushNotifications } = await import('@capacitor/push-notifications');
    return PushNotifications;
  } catch {
    return (window as any).Capacitor?.Plugins?.PushNotifications || null;
  }
}

/**
 * Verifica si el dispositivo actual soporta notificaciones push
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;

  // Si corre en Capacitor Native (APK / iOS Nativo)
  if ((window as any).Capacitor?.isNativePlatform?.()) {
    return true;
  }

  // W3C Web Push (PWA y Navegadores modernos)
  const hasSW = 'serviceWorker' in navigator;
  const hasPush = 'PushManager' in window;
  const hasNotification = typeof window !== 'undefined' && 'Notification' in window;

  return hasSW && hasPush && hasNotification;
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
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      return await reg.pushManager.getSubscription();
    }
    return null;
  } catch (err) {
    console.warn('[NanoNotifications] Error verificando suscripción existente:', err);
    return null;
  }
}

let nativeListenersRegistered = false;

/**
 * Configura canales y listeners nativos para Android APK / iOS
 */
export async function setupNativePushListeners(): Promise<boolean> {
  const PushNotifications = await getCapacitorPush();
  if (!PushNotifications) return false;

  if (nativeListenersRegistered) return true;
  nativeListenersRegistered = true;

  try {
    // 1. Crear canal de alta prioridad para Android 8+
    await PushNotifications.createChannel({
      id: 'liberated_slots',
      name: 'Turnos Liberados',
      description: 'Avisos en vivo de turnos liberados y novedades urgentes',
      importance: 5, // IMPORTANCE_HIGH (banner flotante + sonido)
      visibility: 1, // VISIBILITY_PUBLIC
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: '#10b981',
    });

    // 2. Listener de registro exitoso (FCM Device Token)
    PushNotifications.addListener('registration', async (token: { value: string }) => {
      console.log('[Native FCM] Token recibido:', token.value);
      try {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token.value,
            platform: 'ANDROID_NATIVE',
          }),
        });
      } catch (err) {
        console.error('[Native FCM] Error enviando token al backend:', err);
      }
    });

    // 3. Listener de error de registro
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('[Native FCM] Error de registro:', error);
    });

    // 4. Listener cuando llega notificación en primer plano
    PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
      console.log('[Native FCM] Notificación recibida en foreground:', notification);
      playChime('slot_alert');
      triggerHaptic('success');
    });

    // 5. Listener cuando el usuario toca la notificación en la barra de Android
    PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
      console.log('[Native FCM] Notificación presionada:', action);
      const url = action.notification?.data?.url;
      if (url && typeof window !== 'undefined') {
        window.location.href = url;
      }
    });

    return true;
  } catch (err) {
    console.warn('[Native FCM] Error registrando listeners nativos:', err);
    return false;
  }
}

/**
 * Suscribe al usuario a notificaciones Push en este dispositivo
 */
export async function subscribeUserToPush(): Promise<{ success: boolean; error?: string }> {
  // A. Flujo Nativo Capacitor (Android APK / iOS)
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
    const PushNotifications = await getCapacitorPush();

    if (PushNotifications) {
      try {
        await setupNativePushListeners();
        const perm = await PushNotifications.requestPermissions();

        if (perm.receive === 'granted') {
          await PushNotifications.register();
          triggerHaptic('success');
          playChime('success');
          return { success: true };
        }

        return {
          success: false,
          error: 'Permiso de notificaciones denegado en los ajustes del celular.',
        };
      } catch (err: any) {
        console.error('[Native Push] Error en requestPermissions:', err);
        return { success: false, error: err?.message || 'Error al activar notificaciones en Android.' };
      }
    }

    return {
      success: false,
      error: 'El plugin nativo de push no está enlazado en este APK compilado.',
    };
  }

  // B. Flujo Web / PWA (Safari iOS 16.4+, Chrome Android, Escritorio)
  const hasNotification = typeof window !== 'undefined' && 'Notification' in window;
  const hasSW = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const hasPush = typeof window !== 'undefined' && 'PushManager' in window;

  if (!hasNotification || !hasSW || !hasPush) {
    return {
      success: false,
      error: 'Tu navegador no soporta el estándar de notificaciones Push.',
    };
  }

  try {
    const permission = await window.Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error:
          permission === 'denied'
            ? 'Las notificaciones están bloqueadas en los ajustes de tu navegador.'
            : 'Permiso de notificaciones no concedido.',
      };
    }

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
    if ('serviceWorker' in navigator && 'PushManager' in window) {
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

/**
 * Auto-inicializa notificaciones al abrir la app nativa (APK Android o iOS).
 * Solicita los permisos al sistema operativo automáticamente en cuanto se abre la aplicación,
 * sin necesidad de botones ni carteles manuales en pantalla.
 */
export async function autoInitPushOnAppStart(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Si corre en Capacitor Native (APK Android / iOS)
  const isCapacitor = Boolean((window as any).Capacitor?.isNativePlatform?.());
  if (isCapacitor) {
    try {
      const PushNotifications = await getCapacitorPush();
      if (!PushNotifications) return;

      // Registrar listeners para capturar token y eventos
      await setupNativePushListeners();

      const status = await PushNotifications.checkPermissions();

      // Si ya está concedido, registrar inmediatamente para refrescar token en el backend
      if (status.receive === 'granted') {
        await PushNotifications.register();
        return;
      }

      // Si aún no se pidió o está en estado de solicitud, mostrar el cartel nativo del sistema operativo
      if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale' || !status.receive) {
        const req = await PushNotifications.requestPermissions();
        if (req.receive === 'granted') {
          await PushNotifications.register();
        }
      }
    } catch (e) {
      console.warn('[Push AutoInit] Error en inicialización automática nativa:', e);
    }
  }
}

export { playChime };
