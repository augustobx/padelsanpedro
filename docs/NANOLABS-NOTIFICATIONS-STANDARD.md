# Estándar de Notificaciones NanoLabs (NanoLabs Notifications Standard)

Este documento define la arquitectura y el estándar unificado de notificaciones para todas las aplicaciones SaaS del ecosistema NanoLabs (**OnlyPadel**, **OnlyFood**, **PadelSanPedro**, etc.).

---

## 1. Arquitectura Tri-Capa (Tri-Layer Architecture)

Para garantizar que ningún usuario se pierda una alerta crítica (liberación de un turno, confirmación de un pedido gastronómico, recordatorio de partido), el sistema opera en 3 capas complementarias:

```
┌────────────────────────────────────────────────────────┐
│             NanoLabs Notification Engine               │
│               `src/lib/notifications/`                 │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────────┐ ┌───────────────┐ ┌────────────────┐
│   Capa 1:       │ │   Capa 2:     │ │   Capa 3:      │
│ In-App Center   │ │   Web Push    │ │  Native Push   │
│ (Base de datos) │ │    (VAPID)    │ │ (Capacitor/FCM)│
└─────────────────┘ └───────────────┘ └────────────────┘
```

1. **Capa 1: In-App Center (Persistente en DB)**
   - Guarda el historial de alertas en la tabla `CommunityNotification`.
   - Alimenta el componente `<NanoNotificationBell />` con contador dinámico de "No leídas".
   - Funciona siempre, incluso si el usuario rechazó los permisos de push o si el navegador no soporta ServiceWorker.

2. **Capa 2: Web Push (W3C VAPID)**
   - Funciona sin necesidad de cuentas externas ni servicios pagos.
   - Compatible con:
     - **iPhone / iPad** (Safari PWA en iOS 16.4+).
     - **Android** (Google Chrome PWA y navegador).
     - **Escritorio** (Chrome, Edge, Firefox, Safari).
   - Soporta deep links directos, badges (`setAppBadge`), patrones de vibración y skip de splash screens.

3. **Capa 3: Native Push (Capacitor & FCM)**
   - Para las aplicaciones compiladas como APK nativo en Android.
   - Utiliza `@capacitor/push-notifications` y el permiso `POST_NOTIFICATIONS` de Android 13+.

---

## 2. Estructura de Archivos

```
src/
├── lib/
│   └── notifications/
│       ├── types.ts                # Interfaces y tipos de eventos (SLOT_LIBERATED, ORDER_STATUS, etc.)
│       ├── sender.ts               # Despachador de servidor (WebPush + InApp + Native)
│       ├── client.ts               # Detección de runtime, suscripción y haptics
│       ├── sound.ts                # Sintetizador Web Audio (chimes sin archivos externos)
│       ├── useNanoNotifications.ts # Hook React unificado
│       └── index.ts                # Barrel export
├── components/
│   └── notifications/
│       ├── NanoNotificationBell.tsx   # Campana de cabecera con drawer de notificaciones
│       ├── NanoNotificationOptIn.tsx  # Banner de suscripción para Hubs y homepages
│       └── index.ts
└── app/
    └── api/
        └── notifications/
            ├── list/route.ts        # GET: Lista de notificaciones in-app y conteo no leídas
            ├── mark-read/route.ts   # POST: Marcar notificación(es) como leídas
            └── test/route.ts        # POST: Disparo de notificación de prueba
```

---

## 3. Guía de Uso Rápido en Código (Server Actions / APIs)

### A. Turno Liberado (OnlyPadel / PadelSanPedro)
```typescript
import { broadcastLiberatedSlotPush } from '@/lib/notifications';

await broadcastLiberatedSlotPush({
  courtName: 'Cancha 1 (Cristal)',
  clubName: 'Complejo Central',
  dateStr: '28/09/2026',
  timeStr: '20:30',
  url: '/club/central?slot=20:30&courtId=court-123&date=2026-09-28',
  tenantId: 'tenant-uuid',
});
```

### B. Estado de Pedido (OnlyFood)
```typescript
import { sendOrderStatusPush } from '@/lib/notifications';

await sendOrderStatusPush({
  userId: 'user-uuid',
  orderNumber: 1042,
  restaurantName: 'Parrilla San Pedro',
  statusText: 'En camino a tu domicilio 🛵',
  url: '/pedidos/1042',
  tenantId: 'restaurant-uuid',
});
```

### C. Alerta Masiva de Club / SuperAdmin
```typescript
import { broadcastPushNotification } from '@/lib/notifications';

await broadcastPushNotification(
  {
    title: '📢 Torneo Relámpago este Viernes',
    body: 'Inscripciones abiertas para 4ta y 6ta categoría.',
    url: '/torneos',
    type: 'ANNOUNCEMENT',
  },
  { tenantId: 'club-uuid' } // Omitir para toda la plataforma
);
```

### D. Alerta a Administradores (Nueva reserva o pago)
```typescript
import { sendAdminPushNotification } from '@/lib/notifications';

await sendAdminPushNotification(
  '💰 Nuevo Pago Confirmado',
  'Augusto señó el turno de las 21:00 hs ($8.000).',
  '/admin/calendar',
  'club-uuid'
);
```

---

## 4. Integración en el Frontend

### A. En la Barra de Navegación (Header)
```tsx
import { NanoNotificationBell } from '@/components/notifications';

export function AppHeader() {
  return (
    <header className="flex items-center justify-between p-4">
      <Logo />
      <div className="flex items-center gap-3">
        <NanoNotificationBell accentColor="#10b981" />
        <UserMenu />
      </div>
    </header>
  );
}
```

### B. En el Hub o Home de Clientes (Banner de Alertas)
```tsx
import { NanoNotificationOptIn } from '@/components/notifications';

export function ClubHome() {
  return (
    <div className="space-y-6">
      <Hero />
      <NanoNotificationOptIn 
        accentColor="#10b981"
        title="Alertas Instantáneas de Turnos"
        description="Enterate al instante cuando un abonado libere un turno para hoy."
      />
      <CourtList />
    </div>
  );
}
```

---

## 5. Variables de Entorno Requeridas (.env)

```env
# Claves VAPID para Web Push (generadas con `npx web-push generate-vapid-keys`)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BMjFZNGiFpoPIRdIuDWOnahBijf5E18UabWDNpq_RRZMkwCmGSVXhd-t7es-RN_qDBYD9vY1wnMSQrM29DCoikU
VAPID_PRIVATE_KEY=HK8s-c5fyeAr90pF3feiFPnKHUVlnFUCk1l2uqZs1Yo
NEXT_PUBLIC_VAPID_SUBJECT=mailto:soporte@nanoapps.ar
```

---

## 6. Particularidades por Plataforma

| Plataforma | Soporte Push | Requisito Principal | Comportamiento |
| :--- | :--- | :--- | :--- |
| **iPhone (iOS 16.4+)** | ✅ Nativo en PWA | El usuario debe agregar la app a "Pantalla de Inicio" (PWA). | Al recibir push, vibra y muestra el banner nativo de iOS. Al tocarlo abre la PWA directo en el turno/pedido. |
| **Android (Chrome)** | ✅ PWA y Web | Permiso de notificaciones otorgado. | Llega con pantalla apagada, sonido y badge. Al tocarlo abre en Chrome o PWA instalada. |
| **Android (APK Nativo)** | ✅ Con Capacitor | Requiere `POST_NOTIFICATIONS` en `AndroidManifest.xml` y FCM compilado. | Notificación nativa de sistema vía Google Play Services. |
| **Escritorio (PC/Mac)** | ✅ WebPush | Permiso otorgado en el navegador. | Banner emergente en la esquina de Windows / macOS. |

---

## 7. Deep Linking Directo (Sin Splash Intermedio)
Toda notificación NanoLabs debe contener una URL completa con los parámetros de la entidad:
- **Ejemplo**: `/club/central?slot=20:30&courtId=court-1&date=2026-09-28`
- Los componentes de flujo (`BookingFlow`, `OrderSummary`) leen los search params y:
  1. Saltan la pantalla de Splash automáticamente (`if (search.includes('slot=')) skipSplash`).
  2. Preseleccionan cancha, fecha y horario.
  3. Avanzan al paso final de confirmación en 1 solo tap.
