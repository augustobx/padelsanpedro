'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, WifiOff, RefreshCw } from 'lucide-react';

export default function ConnectivityStatus() {
  const [online, setOnline] = useState(true);
  const [showRestored, setShowRestored] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((reg) => {
          // Si ya hay un worker esperando, ofrecer actualización
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setShowUpdate(true);
          }

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setShowUpdate(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('No se pudo registrar el modo PWA:', error);
        });

      // Recargar cuando el nuevo service worker tome el control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    const onOffline = () => {
      setOnline(false);
      setShowRestored(false);
    };
    const onOnline = () => {
      setOnline(true);
      setShowRestored(true);
      window.setTimeout(() => setShowRestored(false), 3500);
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return (
    <>
      {(!online || showRestored) && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed inset-x-3 top-3 z-[200] mx-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold shadow-2xl transition-all ${
            online ? 'bg-emerald-600 text-white' : 'bg-rose-950/95 border border-rose-800 text-rose-200'
          }`}
        >
          {online ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" /> : <WifiOff className="h-5 w-5 shrink-0 text-rose-400" />}
          <span>
            {online
              ? 'Conexión restablecida. Ya podés continuar.'
              : 'Sin conexión. Tus datos siguen guardados localmente.'}
          </span>
        </div>
      )}

      {showUpdate && (
        <div className="fixed inset-x-3 bottom-20 sm:bottom-6 sm:left-6 sm:right-auto z-[150] max-w-sm mx-auto sm:mx-0">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-xs text-white">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
              <span>Nueva versión disponible</span>
            </div>
            <button
              onClick={handleUpdate}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg shrink-0 cursor-pointer active:scale-95"
            >
              Actualizar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
