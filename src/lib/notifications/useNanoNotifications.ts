'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  getExistingPushSubscription,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  triggerHaptic,
  detectPlatform,
  setupNativePushListeners,
  waitForCapacitor,
} from './client';
import { playChime } from './sound';
import { InAppNotificationItem, PlatformDevice } from './types';

export function useNanoNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [platform, setPlatform] = useState<PlatformDevice>('UNKNOWN');
  const [notifications, setNotifications] = useState<InAppNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  // Cargar notificaciones in-app
  const fetchNotifications = useCallback(async () => {
    try {
      setListLoading(true);
      const res = await fetch('/api/notifications/list');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Error fetching in-app notifications:', err);
    } finally {
      setListLoading(false);
    }
  }, []);

  // Inicialización de soporte y suscripción
  useEffect(() => {
    const supp = isPushSupported();
    setIsSupported(supp);
    const plat = detectPlatform();
    setPlatform(plat);

    waitForCapacitor(3000).then((isNative) => {
      if (isNative) {
        setIsSupported(true);
        setPlatform('ANDROID_NATIVE');
        setupNativePushListeners().then((ok) => {
          if (ok) setIsSubscribed(true);
        });
      } else if (supp) {
        getExistingPushSubscription().then((sub) => {
          setIsSubscribed(Boolean(sub));
        });
      }
    });

    fetchNotifications();

    // Revalidar cada 60s o cuando la ventana vuelve a primer plano
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(fetchNotifications, 60000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Activar o desactivar Push
  const togglePush = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    triggerHaptic('light');

    if (isSubscribed) {
      const res = await unsubscribeUserFromPush();
      setLoading(false);
      if (res.success) {
        setIsSubscribed(false);
        triggerHaptic('medium');
        return { success: true };
      }
      return { success: false, error: 'Error al desactivar notificaciones' };
    } else {
      const res = await subscribeUserToPush();
      setLoading(false);
      if (res.success) {
        setIsSubscribed(true);
        triggerHaptic('success');
        playChime('success');
        return { success: true };
      }
      return { success: false, error: res.error || 'No se pudo activar las notificaciones' };
    }
  };

  // Marcar una como leída
  const markAsRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (err) {
      console.warn('Error marking notification as read:', err);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      triggerHaptic('medium');

      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (err) {
      console.warn('Error marking all notifications as read:', err);
    }
  };

  // Enviar notificación de prueba
  const sendTestNotification = async () => {
    try {
      setLoading(true);
      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🎾 ¡Prueba NanoLabs!',
          body: 'Si ves este mensaje, las notificaciones están 100% operativas en tu dispositivo.',
        }),
      });
      playChime('slot_alert');
      triggerHaptic('success');
      await fetchNotifications();
    } catch (e) {
      console.error('Error sending test:', e);
    } finally {
      setLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    platform,
    notifications,
    unreadCount,
    loading,
    listLoading,
    togglePush,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
    sendTestNotification,
  };
}
