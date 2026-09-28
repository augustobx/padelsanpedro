'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import type { HubConfig } from '@/types/hub-settings';

interface HubSplashScreenProps {
  config: HubConfig;
}

export default function HubSplashScreen({ config }: HubSplashScreenProps) {
  // Synchronous initial state check to prevent any flash of content (FOUC)
  const [status, setStatus] = useState<'showing' | 'exiting' | 'hidden'>(() => {
    if (!config.splashEnabled) return 'hidden';
    if (typeof window !== 'undefined' && config.splashShowOnce) {
      try {
        if (sessionStorage.getItem('psp_hub_splash_seen') === 'true') {
          return 'hidden';
        }
      } catch (e) {
        // sessionStorage disabled or private mode
      }
    }
    return 'showing';
  });

  const accent = config.accentColor || '#10b981';

  // Lock body scroll while splash is active
  useEffect(() => {
    if (status !== 'showing') return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      dismissSplash();
    }, config.splashDuration);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
    };
  }, [status, config.splashDuration]);

  const dismissSplash = () => {
    if (status !== 'showing') return;
    setStatus('exiting');

    if (config.splashShowOnce) {
      try {
        sessionStorage.setItem('psp_hub_splash_seen', 'true');
      } catch (e) {}
    }

    setTimeout(() => {
      document.body.style.overflow = '';
      setStatus('hidden');
    }, 520);
  };

  if (status === 'hidden') return null;

  const isCustomImage = config.splashLogoUrl && (config.splashLogoUrl.startsWith('http') || config.splashLogoUrl.startsWith('/'));

  return (
    <div
      onClick={dismissSplash}
      role="dialog"
      aria-label="Pantalla de bienvenida"
      className={`fixed inset-0 z-[999999] w-screen h-screen flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer transition-all duration-500 ease-out ${
        status === 'exiting'
          ? 'opacity-0 scale-[1.04] pointer-events-none'
          : 'opacity-100 scale-100 pointer-events-auto'
      }`}
      style={{
        backgroundColor: '#020617', // Pure solid dark slate/black - NEVER lets page bleed through
      }}
    >
      {/* Ambient Radial Mesh Glow (contained within the solid #020617 canvas) */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-700"
        style={{
          backgroundColor: accent,
          opacity: status === 'exiting' ? 0 : 0.18,
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-500">
        {/* Top Badge */}
        {config.splashBadge && (
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-7 border shadow-lg backdrop-blur-md"
            style={{
              color: accent,
              borderColor: `${accent}40`,
              backgroundColor: `${accent}12`,
              boxShadow: `0 0 20px ${accent}20`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-ping"
              style={{ backgroundColor: accent }}
            />
            {config.splashBadge}
          </div>
        )}

        {/* Central Logo Emblem */}
        <div className="relative mb-6 group">
          {/* Animated concentric neon aura */}
          <div
            className="absolute -inset-4 rounded-full blur-xl opacity-40 animate-pulse pointer-events-none"
            style={{ backgroundColor: accent }}
          />

          <div
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[32px] bg-slate-900/95 border flex items-center justify-center shadow-2xl transition-transform active:scale-95"
            style={{
              borderColor: `${accent}50`,
              boxShadow: `0 0 45px ${accent}30, inset 0 1px 0 rgba(255,255,255,0.15)`,
            }}
          >
            {isCustomImage ? (
              <img
                src={config.splashLogoUrl}
                alt={config.splashTitle}
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md"
              />
            ) : (
              /* High-tech vector Padel Racket & Neon Ball */
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="racketGradient" x1="14" y1="6" x2="50" y2="44" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6ee7b7" />
                    <stop offset="0.5" stopColor={accent} />
                    <stop offset="1" stopColor="#047857" />
                  </linearGradient>
                  <filter id="neonFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Racket Head */}
                <rect
                  x="14"
                  y="6"
                  width="36"
                  height="38"
                  rx="18"
                  stroke="url(#racketGradient)"
                  strokeWidth="3.2"
                  filter="url(#neonFilter)"
                />

                {/* Sweet-spot holes */}
                <circle cx="26" cy="20" r="1.5" fill="#a7f3d0" />
                <circle cx="32" cy="20" r="1.5" fill="#a7f3d0" />
                <circle cx="38" cy="20" r="1.5" fill="#a7f3d0" />
                <circle cx="23" cy="25" r="1.5" fill="#6ee7b7" />
                <circle cx="29" cy="25" r="1.8" fill="#ffffff" />
                <circle cx="35" cy="25" r="1.8" fill="#ffffff" />
                <circle cx="41" cy="25" r="1.5" fill="#6ee7b7" />
                <circle cx="26" cy="30" r="1.5" fill="#a7f3d0" />
                <circle cx="32" cy="30" r="1.5" fill="#a7f3d0" />
                <circle cx="38" cy="30" r="1.5" fill="#a7f3d0" />

                {/* Throat / Heart Bridge */}
                <path
                  d="M26 43 L32 47.5 L38 43"
                  stroke="url(#racketGradient)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />

                {/* Grip Handle */}
                <path
                  d="M29.5 47.5 L28 60 C28 61 29 62 30 62 L34 62 C35 62 36 61 36 60 L34.5 47.5 Z"
                  fill="#090d16"
                  stroke="url(#racketGradient)"
                  strokeWidth="2"
                />
                <line x1="29" y1="52" x2="35" y2="52" stroke="#6ee7b7" strokeWidth="1" strokeOpacity="0.8" />
                <line x1="28.5" y1="56" x2="35.5" y2="56" stroke="#6ee7b7" strokeWidth="1" strokeOpacity="0.8" />

                {/* Neon Padel Ball with Orbit Effect */}
                <circle cx="48" cy="14" r="5.5" fill={accent} filter="url(#neonFilter)" />
                <path
                  d="M44.5 14 Q48 10.5 51.5 14"
                  stroke="#022c22"
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Brand Title with Gradient Text */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight uppercase flex items-center justify-center gap-1.5">
          {config.splashTitle || 'PADEL SAN PEDRO'}
        </h1>

        {/* Tagline */}
        {config.splashTagline && (
          <p className="mt-2 text-xs sm:text-sm text-slate-400 font-medium max-w-xs leading-relaxed">
            {config.splashTagline}
          </p>
        )}

        {/* Bottom Loading Indicator & Tap to dismiss */}
        <div className="mt-9 flex flex-col items-center gap-3">
          <div className="w-36 h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
            <div
              className="h-full rounded-full transition-all ease-linear"
              style={{
                width: '100%',
                backgroundColor: accent,
                transitionDuration: `${config.splashDuration}ms`,
                boxShadow: `0 0 12px ${accent}`,
              }}
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismissSplash();
            }}
            className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold tracking-wider uppercase transition-colors px-3 py-1 rounded-full hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            Tocar para continuar
          </button>
        </div>
      </div>
    </div>
  );
}
