'use client';

import { useEffect } from 'react';
import { autoInitPushOnAppStart } from '@/lib/notifications/client';

export default function NativeNotificationAutoInit() {
  useEffect(() => {
    // Dispara automáticamente la solicitud del permiso nativo de notificaciones al abrir la app
    autoInitPushOnAppStart();
  }, []);

  return null;
}
