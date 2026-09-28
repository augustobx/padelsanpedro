'use client';

import { useState, useEffect } from 'react';
import type { HubConfig } from '@/types/hub-settings';

interface HubSplashScreenProps {
  config: HubConfig;
}

export default function HubSplashScreen({ config }: HubSplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!config.splashEnabled) return;

    // Check session storage if splash is set to show once per session
    if (config.splashShowOnce) {
      const shown = sessionStorage.getItem('psp_hub_splash_seen');
      if (shown === 'true') {
        return;
      }
    }

    // Show splash
    setIsVisible(true);

    const timer = setTimeout(() => {
      dismissSplash();
    }, config.splashDuration);

    return () => clearTimeout(timer);
  }, [config.splashEnabled, config.splashDuration, config.splashShowOnce]);

  const dismissSplash = () => {
    setIsExiting(true);
    if (config.splashShowOnce) {
      sessionStorage.setItem('psp_hub_splash_seen', 'true');
    }
    setTimeout(() => {
      setIsVisible(false);
    }, 450); // Matches exit transition duration
  };

  if (!isVisible) return null;

  const accent = config.accentColor || '#10b981';

  return (
    <div
      onClick={dismissSplash}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer transition-all duration-500 ease-out ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      } bg-slate-950`}
      style={{
        background: `radial-gradient(circle at 50% 45%, ${accent}18 0%, #020617 75%, #020617 100%)`,
      }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute w-72 h-72 rounded-full blur-3xl opacity-35 animate-pulse pointer-events-none"
        style={{ backgroundColor: accent }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-sm mx-auto">
        {/* Top Badge */}
        {config.splashBadge && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-6 border animate-in fade-in zoom-in-95 duration-500"
            style={{
              color: accent,
              borderColor: `${accent}40`,
              backgroundColor: `${accent}15`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: accent }} />
            {config.splashBadge}
          </div>
        )}

        {/* Central Logo / Icon */}
        <div className="relative mb-6">
          {/* Animated glow outer pulse rings */}
          <div
            className="absolute -inset-3 rounded-[32px] blur-md opacity-50 animate-pulse pointer-events-none"
            style={{ backgroundColor: accent }}
          />

          <div
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] bg-slate-900/90 border border-slate-700/80 shadow-2xl flex items-center justify-center text-5xl sm:text-6xl overflow-hidden transition-transform active:scale-95"
            style={{
              borderColor: `${accent}60`,
              boxShadow: `0 0 40px ${accent}30`,
            }}
          >
            {config.splashLogoUrl && config.splashLogoUrl.startsWith('http') ? (
              <img
                src={config.splashLogoUrl}
                alt={config.splashTitle}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow"
              />
            ) : (
              <span className="drop-shadow-lg">{config.splashLogoUrl || '🎾'}</span>
            )}
          </div>
        </div>

        {/* Brand Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight uppercase">
          {config.splashTitle}
        </h1>

        {/* Tagline */}
        {config.splashTagline && (
          <p className="mt-2 text-xs sm:text-sm text-slate-400 font-medium max-w-xs leading-relaxed">
            {config.splashTagline}
          </p>
        )}

        {/* Bottom Loading Indicator & Tap to skip */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="w-32 h-1 bg-slate-800/80 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all ease-out"
              style={{
                width: '100%',
                backgroundColor: accent,
                transitionDuration: `${config.splashDuration}ms`,
              }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
            Tocar para continuar
          </span>
        </div>
      </div>
    </div>
  );
}
