import { NextResponse } from 'next/server';
import { broadcastPushNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json().catch(() => ({}));
    const title = data.title || '🔔 Prueba de Notificación NanoLabs';
    const body = data.body || '¡El sistema de notificaciones está funcionando correctamente!';
    const url = data.url || '/';

    await broadcastPushNotification({
      title,
      body,
      url,
      type: 'SYSTEM',
      tag: 'nano-test-push',
    });

    return NextResponse.json({ success: true, message: 'Notificación de prueba enviada con éxito' });
  } catch (error: any) {
    console.error('Error sending test notification:', error);
    return NextResponse.json({ error: error?.message || 'Error sending test notification' }, { status: 500 });
  }
}
