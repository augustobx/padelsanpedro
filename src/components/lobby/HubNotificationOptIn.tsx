'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import {
  isPushSupported,
  getExistingPushSubscription,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  triggerHaptic,
} from '@/lib/push-client';

interface HubNotificationOptInProps {
  accentColor?: string;
}

export default function HubNotificationOptIn({ accentColor = '#10b981' }: HubNotificationOptInProps) {
  const [supported, setSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    const isSupp = isPushSupported();
    setSupported(isSupp);

    if (isSupp) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'denied') {
          setPermissionDenied(true);
        } else if (Notification.permission === 'granted') {
          subscribeUserToPush().then((res) => {
            if (res.success) setIsSubscribed(true);
          }).catch(() => {});
        }
      }

      getExistingPushSubscription().then((sub) => {
        if (sub) setIsSubscribed(true);
      });
    }
  }, []);

  if (!supported) return null;

  const handleToggle = async () => {
    setLoading(true);
    setStatusMessage(null);
    triggerHaptic('light');

    if (isSubscribed) {
      const res = await unsubscribeUserFromPush();
      if (res.success) {
        setIsSubscribed(false);
        setStatusMessage('Alertas desactivadas en este dispositivo.');
        triggerHaptic('medium');
      } else {
        setStatusMessage('No se pudo desactivar. Reintentá.');
      }
    } else {
      const res = await subscribeUserToPush();
      if (res.success) {
        setIsSubscribed(true);
        setStatusMessage('¡Listo! Te avisaremos al instante cuando se libere un turno.');
        triggerHaptic('success');
      } else {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied') {
          setPermissionDenied(true);
        }
        setStatusMessage(res.error || 'No se pudieron activar las alertas.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl shadow-black/20 group">
      {/* Background glow */}
      <div
        className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-30"
        style={{ backgroundColor: accentColor }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg transition-transform active:scale-95"
            style={{
              backgroundColor: isSubscribed ? `${accentColor}20` : '#1e293b',
              borderColor: isSubscribed ? `${accentColor}60` : '#334155',
              color: isSubscribed ? accentColor : '#94a3b8',
            }}
          >
            {isSubscribed ? (
              <BellRing className="w-6 h-6 animate-bounce" />
            ) : (
              <Bell className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-white tracking-tight">
                Alertas Instantáneas de Turnos
              </h4>
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider"
                style={{
                  color: accentColor,
                  backgroundColor: `${accentColor}15`,
                  borderColor: `${accentColor}30`,
                }}
              >
                EN VIVO
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              Recibí una notificación nativa en tu celular en el momento exacto en que un complejo libera un turno fijo o se cancela una reserva para hoy.
            </p>
            {statusMessage && (
              <p
                className={`text-xs font-semibold pt-1 flex items-center gap-1.5 ${
                  isSubscribed ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {isSubscribed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {statusMessage}
              </p>
            )}
            {permissionDenied && (
              <p className="text-[11px] text-amber-400/90 pt-0.5">
                Las notificaciones están bloqueadas en tu navegador. Habilitalas desde los ajustes del sitio (ícono de candado en la barra de direcciones).
              </p>
            )}
          </div>
        </div>

        <div className="sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleToggle}
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
              isSubscribed
                ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80 hover:text-white'
                : 'text-slate-950 hover:brightness-105'
            }`}
            style={{
              backgroundColor: isSubscribed ? undefined : accentColor,
              boxShadow: isSubscribed ? undefined : `0 4px 20px ${accentColor}35`,
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Configurando...
              </span>
            ) : isSubscribed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Alertas Activadas</span>
              </>
            ) : (
              <>
                <BellRing className="w-4 h-4" />
                <span>Activar Alertas</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
