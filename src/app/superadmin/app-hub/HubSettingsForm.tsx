'use client';

import { useState, useTransition } from 'react';
import { 
  Sparkles, 
  Smartphone, 
  Play, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Zap, 
  Palette, 
  Clock, 
  Eye, 
  Repeat,
  Radio,
  Sliders
} from 'lucide-react';
import { saveHubConfig } from '@/actions/hub-settings';
import type { HubConfig } from '@/types/hub-settings';

interface HubSettingsFormProps {
  initialConfig: HubConfig;
}

export default function HubSettingsForm({ initialConfig }: HubSettingsFormProps) {
  const [config, setConfig] = useState<HubConfig>(initialConfig);
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State for live interactive splash preview inside the phone frame
  const [isPreviewingSplash, setIsPreviewingSplash] = useState(false);

  const handlePreview = () => {
    setIsPreviewingSplash(false);
    setTimeout(() => {
      setIsPreviewingSplash(true);
      setTimeout(() => {
        setIsPreviewingSplash(false);
      }, config.splashDuration);
    }, 50);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavedSuccess(false);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('splashEnabled', String(config.splashEnabled));
    formData.append('splashTitle', config.splashTitle);
    formData.append('splashTagline', config.splashTagline);
    formData.append('splashBadge', config.splashBadge);
    formData.append('splashLogoUrl', config.splashLogoUrl);
    formData.append('splashStyle', config.splashStyle);
    formData.append('splashDuration', String(config.splashDuration));
    formData.append('splashShowOnce', String(config.splashShowOnce));
    formData.append('heroNoticeText', config.heroNoticeText);
    formData.append('heroNoticeActive', String(config.heroNoticeActive));
    formData.append('accentColor', config.accentColor);

    startTransition(async () => {
      try {
        const res = await saveHubConfig(formData);
        if (res.success) {
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 4000);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Error al guardar los ajustes del Hub');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Configuration Form */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
        {/* Card: Splash Screen Settings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/20 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Splash Screen de la App Hub</h2>
                <p className="text-xs text-slate-400">Pantalla de presentación animada al abrir la aplicación</p>
              </div>
            </div>

            {/* Main Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={config.splashEnabled} 
                onChange={(e) => setConfig({ ...config, splashEnabled: e.target.checked })} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {config.splashEnabled && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-300">
              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Título Principal
                  </label>
                  <input
                    type="text"
                    value={config.splashTitle}
                    onChange={(e) => setConfig({ ...config, splashTitle: e.target.value })}
                    required
                    placeholder="PADEL SAN PEDRO"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Etiqueta / Badge Superior
                  </label>
                  <input
                    type="text"
                    value={config.splashBadge}
                    onChange={(e) => setConfig({ ...config, splashBadge: e.target.value })}
                    placeholder="APP HUB OFICIAL"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Bajada / Subtítulo
                </label>
                <input
                  type="text"
                  value={config.splashTagline}
                  onChange={(e) => setConfig({ ...config, splashTagline: e.target.value })}
                  placeholder="La red oficial de canchas y partidos de San Pedro"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Logo / Icon & Accent Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Ícono o URL de Logo</span>
                    <span className="text-[10px] text-slate-500 font-normal">Emoji o link de imagen</span>
                  </label>
                  <input
                    type="text"
                    value={config.splashLogoUrl}
                    onChange={(e) => setConfig({ ...config, splashLogoUrl: e.target.value })}
                    placeholder="🎾 o https://..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Color de Acento Neón</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{config.accentColor}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-slate-950 border border-slate-800 p-1"
                    />
                    <input
                      type="text"
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      placeholder="#10b981"
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Animation Style Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Estilo de Animación
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'neon-glow', name: 'Neón Pulsante', desc: 'Anillo de luz y pulso activo', icon: Zap },
                    { id: 'cinematic', name: 'Cinemático', desc: 'Zoom suave y desenfoque', icon: Layers },
                    { id: 'minimal-modern', name: 'Minimal Pro', desc: 'Fade limpio y elegante', icon: Sparkles },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setConfig({ ...config, splashStyle: style.id as any })}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        config.splashStyle === style.id
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <style.icon className={`w-4 h-4 mb-2 ${config.splashStyle === style.id ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <div>
                        <p className="text-xs font-bold text-white">{style.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{style.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Slider & Frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Duración en pantalla
                    </span>
                    <span className="text-xs font-black text-emerald-400">
                      {(config.splashDuration / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="4000"
                    step="200"
                    value={config.splashDuration}
                    onChange={(e) => setConfig({ ...config, splashDuration: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-semibold">
                    <span>1.0s (Rápido)</span>
                    <span>2.0s (Equilibrado)</span>
                    <span>4.0s (Largo)</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                      <Repeat className="w-3.5 h-3.5 text-cyan-400" /> Frecuencia de Aparición
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {config.splashShowOnce 
                        ? '1 sola vez por sesión (Al abrir la app o nueva pestaña)' 
                        : 'Siempre en cada recarga de página'}
                    </p>
                  </div>

                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.splashShowOnce}
                      onChange={(e) => setConfig({ ...config, splashShowOnce: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-300 font-medium">
                      Mostrar 1 vez por sesión (Recomendado)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card: Hub Banner / Mensaje Destacado */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Aviso Destacado en el Hub</h2>
                <p className="text-xs text-slate-400">Mensaje superior para todos los usuarios de la ciudad</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={config.heroNoticeActive} 
                onChange={(e) => setConfig({ ...config, heroNoticeActive: e.target.checked })} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {config.heroNoticeActive && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Texto del Mensaje
              </label>
              <input
                type="text"
                value={config.heroNoticeText}
                onChange={(e) => setConfig({ ...config, heroNoticeText: e.target.value })}
                placeholder="¡Bienvenidos a la red oficial de canchas de San Pedro!"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Configuración del Hub
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePreview}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-5 rounded-2xl border border-slate-700 transition-all flex items-center gap-2 shrink-0 active:scale-[0.98]"
          >
            <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Probar Splash</span>
          </button>
        </div>

        {/* Success / Error Messages */}
        {savedSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Ajustes del Hub guardados exitosamente. Los cambios ya impactaron en la app.</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </form>

      {/* Live Phone Mockup & Real-Time Simulator */}
      <div className="lg:col-span-5 sticky top-24 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Simulador en Vivo</h3>
          </div>
          <button
            type="button"
            onClick={handlePreview}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
          >
            <Play className="w-3 h-3 fill-amber-400" /> Replay Splash
          </button>
        </div>

        {/* Mobile Device Frame */}
        <div className="relative mx-auto w-full max-w-[340px] aspect-[9/18.5] bg-slate-950 rounded-[42px] border-[6px] border-slate-800 shadow-2xl shadow-emerald-500/5 overflow-hidden flex flex-col">
          {/* Top Notch / Dynamic Island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950 mr-2" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          </div>

          {/* Screen Content */}
          <div className="relative w-full h-full bg-slate-950 flex flex-col overflow-hidden text-slate-100 font-sans select-none">
            {/* If Splash is active in simulator */}
            {isPreviewingSplash && config.splashEnabled ? (
              <div 
                className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center transition-all bg-[#020617]"
              >
                {/* Glow ring background */}
                <div 
                  className="absolute w-44 h-44 rounded-full blur-3xl opacity-25 animate-pulse pointer-events-none"
                  style={{ backgroundColor: config.accentColor }}
                />

                {/* Badge */}
                {config.splashBadge && (
                  <span 
                    className="relative text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full mb-5 border shadow-sm"
                    style={{ 
                      color: config.accentColor,
                      borderColor: `${config.accentColor}40`,
                      backgroundColor: `${config.accentColor}15`
                    }}
                  >
                    {config.splashBadge}
                  </span>
                )}

                {/* Logo / Badge */}
                <div 
                  className="relative w-24 h-24 rounded-[28px] bg-slate-900 border flex items-center justify-center text-4xl shadow-2xl mb-4 transition-transform duration-500 scale-100"
                  style={{
                    borderColor: `${config.accentColor}50`,
                    boxShadow: `0 0 35px ${config.accentColor}30`,
                  }}
                >
                  {config.splashLogoUrl && (config.splashLogoUrl.startsWith('http') || config.splashLogoUrl.startsWith('/')) ? (
                    <img src={config.splashLogoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                  ) : (
                    <svg className="w-14 h-14" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="14" y="6" width="36" height="38" rx="18" stroke={config.accentColor} strokeWidth="3.2" />
                      <circle cx="26" cy="20" r="1.5" fill="#a7f3d0" />
                      <circle cx="32" cy="20" r="1.5" fill="#a7f3d0" />
                      <circle cx="38" cy="20" r="1.5" fill="#a7f3d0" />
                      <circle cx="29" cy="25" r="1.8" fill="#ffffff" />
                      <circle cx="35" cy="25" r="1.8" fill="#ffffff" />
                      <circle cx="32" cy="30" r="1.5" fill="#a7f3d0" />
                      <path d="M26 43 L32 47.5 L38 43" stroke={config.accentColor} strokeWidth="2.8" strokeLinecap="round" />
                      <path d="M29.5 47.5 L28 60 C28 61 29 62 30 62 L34 62 C35 62 36 61 36 60 L34.5 47.5 Z" fill="#090d16" stroke={config.accentColor} strokeWidth="2" />
                      <circle cx="48" cy="14" r="5" fill={config.accentColor} />
                    </svg>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-lg font-black text-white tracking-tight leading-tight uppercase">
                  {config.splashTitle}
                </h2>

                {/* Tagline */}
                {config.splashTagline && (
                  <p className="text-[11px] text-slate-400 font-medium mt-1.5 max-w-[200px] leading-relaxed">
                    {config.splashTagline}
                  </p>
                )}

                {/* Progress bar in splash */}
                <div className="w-28 h-1 bg-slate-900 rounded-full mt-6 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full rounded-full transition-all ease-linear"
                    style={{ 
                      width: '100%', 
                      backgroundColor: config.accentColor,
                      transitionDuration: `${config.splashDuration}ms`,
                      boxShadow: `0 0 10px ${config.accentColor}`
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Hub Home Screen Simulator View */
              <div className="flex-1 flex flex-col overflow-y-auto scrollbar-none text-[11px] p-3 space-y-3">
                {/* Header inside phone */}
                <div className="flex items-center justify-between pt-5 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{config.splashLogoUrl || '🎾'}</span>
                    <span className="font-black text-white tracking-tight text-xs">PADEL<span style={{ color: config.accentColor }}>SP</span></span>
                  </div>
                  <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-slate-400">San Pedro</span>
                </div>

                {/* Notice text preview */}
                {config.heroNoticeActive && config.heroNoticeText && (
                  <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 p-2 rounded-xl text-[10px] font-medium flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{config.heroNoticeText}</span>
                  </div>
                )}

                {/* Hero preview */}
                <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 space-y-1">
                  <span className="text-[8px] font-black uppercase text-emerald-400 tracking-wider">Canchas & Partidos</span>
                  <p className="text-xs font-black text-white leading-tight">Reservá tu cancha al instante</p>
                  <p className="text-[10px] text-slate-400">3 complejos activos en San Pedro</p>
                </div>

                {/* Club preview cards */}
                <div className="space-y-2">
                  {['La Estación Padel', 'San Pedro Padel', 'Club Mitre Padel'].map((name, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{name}</p>
                        <p className="text-[9px] text-slate-400">Turnos libres hoy</p>
                      </div>
                      <span 
                        className="text-[9px] font-bold px-2 py-1 rounded-lg text-slate-950"
                        style={{ backgroundColor: config.accentColor }}
                      >
                        Ver
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5"
                  >
                    <Play className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /> Probar Splash en el marco
                  </button>
                </div>
              </div>
            )}

            {/* Bottom bar indicator inside phone */}
            <div className="h-5 bg-slate-950 flex items-center justify-center">
              <div className="w-20 h-1 bg-slate-700 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
