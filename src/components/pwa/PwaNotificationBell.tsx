'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing, BellOff, Check, Loader2 } from 'lucide-react';
import {
  subscribeUserToPush,
  unsubscribeUserFromPush,
  getExistingPushSubscription,
  triggerHaptic,
  isPushSupported
} from '@/lib/push-client';

export default function PwaNotificationBell() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  useEffect(() => {
    if (isPushSupported()) {
      setSupported(true);
      getExistingPushSubscription().then((sub) => {
        setSubscribed(Boolean(sub));
      });
    }
  }, []);

  if (!supported) return null;

  const handleClick = async () => {
    triggerHaptic('medium');
    setLoading(true);

    if (subscribed) {
      const res = await unsubscribeUserFromPush();
      setLoading(false);
      if (res.success) {
        setSubscribed(false);
        showFeedback('Notificaciones desactivadas.');
      }
    } else {
      const res = await subscribeUserToPush();
      setLoading(false);
      if (res.success) {
        setSubscribed(true);
        showFeedback('¡Notificaciones activadas! Te avisaremos de turnos liberados.');
      } else {
        showFeedback(res.error || 'No se pudo activar el permiso de avisos');
      }
    }
  };

  const showFeedback = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 4000);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        disabled={loading}
        title={subscribed ? 'Notificaciones activadas (clic para desactivar)' : 'Activar alertas de turnos liberados y partidos'}
        className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer border ${
          subscribed
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
        }`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
        ) : subscribed ? (
          <BellRing className="w-5 h-5 animate-pulse text-emerald-400" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
      </button>

      {showToast && (
        <div className="absolute right-0 top-12 z-50 w-64 bg-slate-900 border border-slate-700 text-slate-200 text-xs p-3 rounded-xl shadow-2xl shadow-black/80 font-medium animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{showToast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
