'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, Share, PlusSquare, X, Bell, BellRing, Smartphone, Check } from 'lucide-react';
import { subscribeUserToPush, getExistingPushSubscription, triggerHaptic } from '@/lib/push-client';

export default function PwaInstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si ya está en modo standalone (instalada)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detectar si es iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Capturar evento de instalación nativo (Chrome / Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Verificar estado de suscripción Push si el navegador lo soporta
    getExistingPushSubscription().then((sub) => {
      if (sub) setPushSubscribed(true);
    });

    // Revisar si el usuario ya descartó el banner en esta sesión
    const isDismissed = sessionStorage.getItem('psp_pwa_dismissed') === 'true';
    if (isDismissed) setDismissed(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    setDismissed(true);
    sessionStorage.setItem('psp_pwa_dismissed', 'true');
  };

  const handleTogglePush = async () => {
    triggerHaptic('medium');
    setPushLoading(true);
    setPushFeedback(null);

    const res = await subscribeUserToPush();
    setPushLoading(false);

    if (res.success) {
      setPushSubscribed(true);
      setPushFeedback('¡Notificaciones activadas! Te avisaremos de turnos liberados.');
      setTimeout(() => setPushFeedback(null), 4000);
    } else {
      setPushFeedback(res.error || 'No se pudieron activar las notificaciones');
      setTimeout(() => setPushFeedback(null), 5000);
    }
  };

  // Si ya está instalada o descartada, solo mostrar un pill sutil para notificaciones si no están activadas
  if (isStandalone) {
    if (pushSubscribed) return null;

    return (
      <div className="fixed bottom-4 right-4 z-50 animate-bounce-subtle">
        <button
          onClick={handleTogglePush}
          disabled={pushLoading}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-emerald-500/25 border border-emerald-400 transition-transform active:scale-95"
        >
          <BellRing className="w-4 h-4 shrink-0" />
          <span>{pushLoading ? 'Activando...' : 'Activar alertas de turnos'}</span>
        </button>
      </div>
    );
  }

  if (dismissed && !showIosModal) {
    return null;
  }

  // Mostrar banner de instalación para Android o iOS
  return (
    <>
      <div className="fixed bottom-3 inset-x-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md mx-auto sm:mx-0">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-center gap-3.5 ring-1 ring-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-emerald-500/30 shadow-md">
            <Image
              src="/icons/icon-192x192.png"
              alt="Padel San Pedro Logo"
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-extrabold text-sm truncate">Padel San Pedro</span>
              <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-500/30">
                App Pro
              </span>
            </div>
            <p className="text-slate-400 text-xs truncate mt-0.5">
              Instalá la app para alertas de turnos y torneos
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Cerrar"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {pushFeedback && (
          <div className="mt-2 bg-slate-900 text-emerald-400 border border-emerald-500/40 rounded-xl p-2.5 text-xs text-center font-bold shadow-xl animate-in fade-in">
            {pushFeedback}
          </div>
        )}
      </div>

      {/* MODAL GUÍA PARA iOS (iPhone / Safari) */}
      {showIosModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-100">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/40 shrink-0">
                <Image
                  src="/icons/icon-192x192.png"
                  alt="Padel San Pedro"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-base">Instalar en iPhone</h3>
                <p className="text-slate-400 text-xs">Padel San Pedro Oficial</p>
              </div>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed mb-5">
              Apple requiere agregar la app a tu Pantalla de Inicio para funcionar en pantalla completa y habilitar notificaciones push de turnos liberados:
            </p>

            <div className="space-y-3.5 mb-6">
              <div className="flex items-start gap-3 bg-slate-800/70 p-3 rounded-2xl border border-slate-700/50">
                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl shrink-0">
                  <Share className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white block">Paso 1</span>
                  <span className="text-slate-400">
                    Toca el botón <strong className="text-slate-200">Compartir</strong> en la barra inferior de Safari.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/70 p-3 rounded-2xl border border-slate-700/50">
                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl shrink-0">
                  <PlusSquare className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white block">Paso 2</span>
                  <span className="text-slate-400">
                    Baja en las opciones y selecciona <strong className="text-slate-200">"Agregar a Inicio"</strong>.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/70 p-3 rounded-2xl border border-slate-700/50">
                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white block">Paso 3</span>
                  <span className="text-slate-400">
                    Toca <strong className="text-slate-200">"Agregar"</strong> arriba a la derecha. ¡Ya la tendrás instalada!
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-98"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
