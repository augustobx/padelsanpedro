'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  Phone, 
  ChevronRight, 
  Sparkles, 
  Trophy, 
  Users, 
  MessageSquare, 
  Calendar,
  Layers, 
  ShieldCheck, 
  Flame, 
  ArrowRight, 
  Lock, 
  Clock, 
  Zap,
  Radio,
  Share2,
  ExternalLink,
  Target
} from 'lucide-react';
import type { PublicClubCard, HubHighlights } from '@/actions/clubs';
import { type HubConfig, DEFAULT_HUB_CONFIG } from '@/types/hub-settings';
import PwaNotificationBell from '@/components/pwa/PwaNotificationBell';
import HubSplashScreen from './HubSplashScreen';
import HubNotificationOptIn from './HubNotificationOptIn';

interface LobbyDirectoryProps {
  clubs: PublicClubCard[];
  session: {
    id: string;
    name: string | null;
    lastName: string | null;
    category: string | null;
    avatarUrl: string | null;
  } | null;
  hubHighlights?: HubHighlights;
  recentPostsCount?: number;
  openMatchesCount?: number;
  hubConfig?: HubConfig;
}

export default function LobbyDirectory({
  clubs,
  session,
  hubHighlights,
  recentPostsCount = 0,
  openMatchesCount = 0,
  hubConfig = DEFAULT_HUB_CONFIG,
}: LobbyDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'indoor' | 'synthetic'>('all');

  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      const matchesSearch =
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.surfaces.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedFilter === 'indoor') {
        return club.hasIndoor;
      }
      if (selectedFilter === 'synthetic') {
        return club.surfaces.some((s) => s.toLowerCase().includes('sint') || s.toLowerCase().includes('piso'));
      }

      return true;
    });
  }, [clubs, searchTerm, selectedFilter]);

  // Greeting based on Argentina time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '¡Buen día';
    if (hour >= 12 && hour < 20) return '¡Buenas tardes';
    return '¡Buenas noches';
  }, []);

  const accent = hubConfig.accentColor || '#10b981';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-12 selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Configurable Splash Screen (Triggered once per session or as configured) */}
      <HubSplashScreen config={hubConfig} />

      {/* 2. Top Header / App Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg font-black text-xl shrink-0 transition-transform active:scale-95"
              style={{
                backgroundColor: `${accent}20`,
                borderColor: `${accent}50`,
                boxShadow: `0 4px 16px ${accent}25`,
              }}
            >
              {hubConfig.splashLogoUrl && (hubConfig.splashLogoUrl.startsWith('http') || hubConfig.splashLogoUrl.startsWith('/')) ? (
                <img src={hubConfig.splashLogoUrl} alt="Logo" className="w-6 h-6 object-contain" />
              ) : hubConfig.splashLogoUrl === 'padel-racket' || !hubConfig.splashLogoUrl ? (
                <svg className="w-6 h-6" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="32" cy="25" rx="17" ry="21" stroke={accent} strokeWidth="3" fill={`${accent}18`} />
                  <path d="M32 46 L32 58" stroke="#94a3b8" strokeWidth="4.5" strokeLinecap="round" />
                  <circle cx="28" cy="21" r="1.5" fill={accent} />
                  <circle cx="36" cy="21" r="1.5" fill={accent} />
                  <circle cx="32" cy="27" r="1.5" fill={accent} />
                  <circle cx="28" cy="33" r="1.5" fill={accent} />
                  <circle cx="36" cy="33" r="1.5" fill={accent} />
                  <circle cx="43" cy="36" r="4.5" fill="#facc15" />
                </svg>
              ) : (
                <span className="text-lg">{hubConfig.splashLogoUrl}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  PADEL<span style={{ color: accent }}>SANPEDRO</span>
                </span>
                <span 
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-wider"
                  style={{
                    color: accent,
                    backgroundColor: `${accent}15`,
                    borderColor: `${accent}30`,
                  }}
                >
                  {hubConfig.splashBadge || 'HUB'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400 shrink-0" /> San Pedro, Bs. As.
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  {clubs.length} clubes online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PwaNotificationBell />
            {session ? (
              <Link
                href="/perfil"
                className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-2xl transition-all shadow-sm"
              >
                <div 
                  className="w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs overflow-hidden border"
                  style={{
                    backgroundColor: `${accent}20`,
                    color: accent,
                    borderColor: `${accent}40`,
                  }}
                >
                  {session.avatarUrl ? (
                    <img src={session.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (session.name || 'J')[0].toUpperCase()
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">{session.name}</p>
                  <p className="text-[10px] font-semibold" style={{ color: accent }}>
                    {session.category || 'Jugador'}
                  </p>
                </div>
              </Link>
            ) : (
              <Link
                href="/login-usuario"
                className="text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                style={{
                  backgroundColor: accent,
                  boxShadow: `0 4px 14px ${accent}30`,
                }}
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 3. Global Hub Announcement Banner (Configurable in SuperAdmin) */}
      {hubConfig.heroNoticeActive && hubConfig.heroNoticeText && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border-b border-emerald-500/20 px-4 py-2.5">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold min-w-0">
              <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
              <span className="truncate">{hubConfig.heroNoticeText}</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest shrink-0 hidden sm:inline">
              Comunidad San Pedro
            </span>
          </div>
        </div>
      )}

      {/* 4. Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-5 space-y-6">
        
        {/* Playtomic-style Hero Banner & Live Quick Stats */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black/40">
          <div 
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: accent }}
          />

          <div className="relative z-10 max-w-2xl">
            {/* Top pill / player greeting */}
            <div className="inline-flex items-center gap-2 bg-slate-950/60 border border-slate-800 text-xs font-bold px-3.5 py-1.5 rounded-full mb-3 shadow-inner">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
              <span className="text-white">
                {greeting}, {session?.name ? session.name : 'Padelero'}!
              </span>
              {session?.category && (
                <span className="text-slate-400 border-l border-slate-700 pl-2 text-[11px]">
                  {session.category}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Elegí tu complejo favorito y <span style={{ color: accent }}>reservá tu turno</span> al instante.
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
              La red centralizada de San Pedro: disponibilidad en tiempo real, alertas de turnos liberados y convocatorias de partidos abiertos.
            </p>

            {/* Live Indicators Pills */}
            <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800/80">
              <span className="inline-flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm">
                🎾 <strong>{hubHighlights?.todayAvailableCount ? `${hubHighlights.todayAvailableCount}+` : `${clubs.length * 6}+`}</strong> turnos libres hoy
              </span>

              {hubHighlights?.liberatedSlotsToday && hubHighlights.liberatedSlotsToday.length > 0 ? (
                <a 
                  href="#turnos-liberados" 
                  className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-black px-3 py-1.5 rounded-xl transition-all animate-pulse"
                >
                  <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {hubHighlights.liberatedSlotsToday.length} {hubHighlights.liberatedSlotsToday.length === 1 ? 'turno fijo liberado hoy' : 'turnos fijos liberados hoy'}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl">
                  ⚡ Grillas sincronizadas en vivo
                </span>
              )}

              {hubHighlights?.openMatchesCount && hubHighlights.openMatchesCount > 0 ? (
                <Link
                  href="/comunidad?tab=partidos"
                  className="inline-flex items-center gap-1.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  {hubHighlights.openMatchesCount} {hubHighlights.openMatchesCount === 1 ? 'partido buscando jugador' : 'partidos buscando jugadores'}
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {/* 5. Sección de Turnos Liberados Hoy (Avisos de última hora) */}
        {hubHighlights?.liberatedSlotsToday && hubHighlights.liberatedSlotsToday.length > 0 && (
          <section id="turnos-liberados" className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-900/30 border-2 border-amber-500/50 p-5 sm:p-6 shadow-xl shadow-amber-500/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      ¡Turnos Liberados de Último Momento!
                    </h2>
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      Hoy
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/80">
                    Abonados que avisaron que hoy no juegan. ¡Aprovechalos antes de que se ocupen!
                  </p>
                </div>
              </div>
              
              <div className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-500/30 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                {hubHighlights.liberatedSlotsToday.length} {hubHighlights.liberatedSlotsToday.length === 1 ? 'disponible' : 'disponibles'}
              </div>
            </div>

            {/* Grid de turnos liberados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {hubHighlights.liberatedSlotsToday.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-slate-900/90 hover:bg-slate-850 border border-amber-500/30 hover:border-amber-400/60 rounded-2xl p-4 transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-black text-emerald-400 truncate">
                        {slot.clubName}
                      </span>
                      <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 whitespace-nowrap">
                        ⚡ Turno Liberado
                      </span>
                    </div>

                    <p className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      {slot.timeStr} a {slot.endTimeStr} hs
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      {slot.courtName}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Hoy en San Pedro</span>
                    <Link
                      href={`/club/${slot.clubSlug}`}
                      className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-amber-500/15 group-hover:scale-105"
                    >
                      Reservar <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Playtomic-style "Radar de Partidos Abiertos" */}
        {hubHighlights?.activeOpenMatches && hubHighlights.activeOpenMatches.length > 0 && (
          <section className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Radar de Partidos: ¡Faltan Jugadores!
                    </h2>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Convocatorias abiertas por otros jugadores en San Pedro. Sumate en 1 tap.
                  </p>
                </div>
              </div>

              <Link
                href="/comunidad?tab=partidos"
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0 self-start sm:self-auto"
              >
                Ver todos los partidos <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {hubHighlights.activeOpenMatches.map((m) => (
                <Link
                  key={m.id}
                  href="/comunidad?tab=partidos"
                  className="bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-300 truncate">{m.clubName}</span>
                      <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                        Falta {m.slotsNeeded}
                      </span>
                    </div>

                    <p className="text-sm font-black text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      {m.dateStr} · {m.startTime} hs
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      {m.level ? `Nivel: ${m.level}` : 'Nivel libre'} · Organiza: {m.creatorName}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-cyan-400 font-bold group-hover:underline">Sumarme al partido</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 7. Quick Hub Modules Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="#complejos"
            className="flex flex-col p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 transition-all hover:border-emerald-500/40 group shadow-md"
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
              style={{ backgroundColor: `${accent}20`, color: accent }}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
              Reservar Cancha
            </span>
            <span className="text-xs text-slate-400 mt-0.5">{clubs.length} complejos activos</span>
          </Link>

          <Link
            href="/comunidad?tab=partidos"
            className="flex flex-col p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 transition-all hover:border-cyan-500/40 group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                Partidos Abiertos
              </span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <span className="text-xs text-slate-400 mt-0.5">¿Falta uno? Sumate</span>
          </Link>

          <Link
            href="/comunidad"
            className="flex flex-col p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 transition-all hover:border-purple-500/40 group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
              Comunidad
            </span>
            <span className="text-xs text-slate-400 mt-0.5">Muro y avisos locales</span>
          </Link>

          <Link
            href="/ranking"
            className="flex flex-col p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 transition-all hover:border-amber-500/40 group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
              Ranking Oficial
            </span>
            <span className="text-xs text-slate-400 mt-0.5">Circuito San Pedro</span>
          </Link>
        </section>

        {/* 7.5. Alertas de Turnos Liberados Push Opt-In */}
        <HubNotificationOptIn accentColor={accent} />

        {/* 8. Directory Header, Search & Filters */}
        <section id="complejos" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Complejos y Canchas
                <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                  {filteredClubs.length} disponibles
                </span>
              </h2>
              <p className="text-xs text-slate-400">Seleccioná un club para ver la grilla de turnos y reservar</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedFilter === 'all'
                    ? 'text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
                style={{
                  backgroundColor: selectedFilter === 'all' ? accent : undefined,
                }}
              >
                Todos ({clubs.length})
              </button>
              <button
                onClick={() => setSelectedFilter('indoor')}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedFilter === 'indoor'
                    ? 'text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
                style={{
                  backgroundColor: selectedFilter === 'indoor' ? accent : undefined,
                }}
              >
                Techadas / Indoor
              </button>
              <button
                onClick={() => setSelectedFilter('synthetic')}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedFilter === 'synthetic'
                    ? 'text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
                style={{
                  backgroundColor: selectedFilter === 'synthetic' ? accent : undefined,
                }}
              >
                Sintético / Blindex
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar club por nombre o superficie (ej: Blindex, Sintético, Indoor)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
            />
          </div>

          {/* Club Cards Grid */}
          {filteredClubs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/40">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3 text-2xl">
                🏟️
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No se encontraron complejos</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                {searchTerm
                  ? 'Probá buscando con otro término o limpiando los filtros.'
                  : 'Aún no hay clubes configurados en la plataforma.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedFilter('all');
                  }}
                  className="mt-4 text-xs font-bold hover:underline"
                  style={{ color: accent }}
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClubs.map((club) => (
                <div
                  key={club.id}
                  className="overflow-hidden rounded-3xl bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-xl shadow-black/30"
                >
                  {/* Card Header / Image */}
                  <div className="relative h-44 w-full bg-slate-850 overflow-hidden">
                    {club.heroImage ? (
                      <img
                        src={club.heroImage}
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950/60 flex items-center justify-center">
                        <div className="text-center p-4">
                          <span className="text-4xl mb-2 block">🎾</span>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Complejo Deportivo
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent opacity-90" />
                    
                    {/* Badges on image */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="bg-slate-950/85 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1 rounded-xl border border-white/10 flex items-center gap-1.5 shadow-sm">
                        <Layers className="w-3 h-3 text-emerald-400" />
                        {club.courtsCount} {club.courtsCount === 1 ? 'Cancha' : 'Canchas'}
                      </span>
                      {club.hasIndoor && (
                        <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-md">
                          Indoor Techado
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Abierto
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                          {club.name}
                        </h3>
                      </div>

                      {club.surfaces.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{club.surfaces.join(' • ')}</span>
                        </p>
                      )}

                      {club.contactPhone && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{club.contactPhone}</span>
                        </p>
                      )}
                    </div>

                    {/* Turno Fijo Liberado Highlight */}
                    {club.liberatedSlots && club.liberatedSlots.length > 0 && (
                      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/35 p-3 space-y-2 shadow-inner">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[11px] font-black text-amber-400 uppercase tracking-wider">
                            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
                            ¡Turno Fijo Liberado!
                          </span>
                          <span className="text-[10px] font-black text-amber-300 bg-amber-500/25 px-2 py-0.5 rounded-full border border-amber-500/40">
                            HOY
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-sm font-black text-white block">
                              {club.liberatedSlots[0].timeStr} hs
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {club.liberatedSlots[0].courtName}
                            </span>
                          </div>
                          <Link
                            href={`/club/${club.slug}?slot=${club.liberatedSlots[0].timeStr}`}
                            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] uppercase tracking-wide transition-all shadow-md active:scale-95 flex items-center gap-1"
                          >
                            <span>Reservar</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Turnos Libres Hoy */}
                    <div className="space-y-2 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          {club.todayAvailableCount > 0 ? (
                            <span>
                              <strong className="text-emerald-400 font-black text-sm">{club.todayAvailableCount}</strong>{' '}
                              {club.todayAvailableCount === 1 ? 'turno libre hoy' : 'turnos libres hoy'}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">Sin turnos disponibles hoy</span>
                          )}
                        </span>
                        {club.todayAvailableCount > 0 && (
                          <span className="text-[9px] font-black tracking-widest text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                            En Vivo
                          </span>
                        )}
                      </div>

                      {club.upcomingSlots && club.upcomingSlots.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                          {club.upcomingSlots.slice(0, 4).map((slotTime) => (
                            <Link
                              key={slotTime}
                              href={`/club/${club.slug}?slot=${slotTime}`}
                              className="px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 hover:border-emerald-400 text-xs font-bold border border-slate-700/60 transition-all active:scale-95 whitespace-nowrap shadow-sm"
                              title={`Reservar turno de las ${slotTime} en ${club.name}`}
                            >
                              {slotTime}
                            </Link>
                          ))}
                          {club.upcomingSlots.length > 4 && (
                            <Link
                              href={`/club/${club.slug}`}
                              className="text-[11px] font-bold text-slate-400 hover:text-white px-1.5 py-1 transition-colors whitespace-nowrap"
                            >
                              +{club.upcomingSlots.length - 4} más
                            </Link>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      {club.contactPhone && (
                        <a
                          href={`https://wa.me/${club.contactPhone.replace(/\D/g, '')}?text=Hola,%20contacto%20desde%20la%20App%20PadelSanPedro`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white p-3 rounded-2xl border border-slate-700/80 transition-all shrink-0 active:scale-95"
                          title="WhatsApp del Club"
                        >
                          <Phone className="w-4 h-4 text-emerald-400" />
                        </a>
                      )}

                      <Link
                        href={`/club/${club.slug}`}
                        className="flex-1 text-slate-950 font-black py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 group/btn shadow-md active:scale-[0.98]"
                        style={{
                          backgroundColor: accent,
                          boxShadow: `0 4px 16px ${accent}25`,
                        }}
                      >
                        <span>Ver Canchas y Turnos</span>
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 9. Call to action: ¿Querés jugar hoy? */}
        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
              <Flame className="w-4 h-4 text-amber-400" />
              ¿Querés jugar hoy y te falta un jugador?
            </h4>
            <p className="text-xs text-slate-400">
              Creá un partido abierto o sumate a convocatorias en cualquiera de las canchas de San Pedro.
            </p>
          </div>
          <Link
            href="/comunidad?tab=partidos"
            className="bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 whitespace-nowrap transition-colors shrink-0"
          >
            Ver Convocatorias
          </Link>
        </section>

        {/* 10. Footer */}
        <footer className="pt-8 pb-16 text-center text-xs text-slate-500 space-y-2 border-t border-slate-900/80">
          <p>© 2026 PadelSanPedro · La red oficial de canchas de San Pedro</p>
          <div className="flex items-center justify-center gap-4 text-[11px]">
            <Link href="/login" className="text-slate-400 hover:text-emerald-400 font-semibold transition-colors flex items-center gap-1">
              <Lock className="w-3 h-3" /> Acceso Clubes
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/superadmin/login" className="text-slate-500 hover:text-indigo-400 transition-colors">
              SuperAdmin
            </Link>
          </div>
        </footer>
      </main>

      {/* 11. Bottom Navigation Bar for Mobile (Native App Experience) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 md:hidden">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1 text-center">
          <Link
            href="/"
            className="flex flex-col items-center py-1 font-bold transition-colors"
            style={{ color: accent }}
          >
            <Calendar className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Canchas</span>
          </Link>

          <Link
            href="/comunidad?tab=partidos"
            className="flex flex-col items-center py-1 text-slate-400 hover:text-white transition-colors"
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Partidos</span>
          </Link>

          <Link
            href="/comunidad"
            className="flex flex-col items-center py-1 text-slate-400 hover:text-white transition-colors"
          >
            <MessageSquare className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Muro</span>
          </Link>

          <Link
            href="/ranking"
            className="flex flex-col items-center py-1 text-slate-400 hover:text-white transition-colors"
          >
            <Trophy className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Ranking</span>
          </Link>

          <Link
            href={session ? '/perfil' : '/login-usuario'}
            className="flex flex-col items-center py-1 text-slate-400 hover:text-white transition-colors"
          >
            <div className="w-4 h-4 mb-0.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px] font-bold">
              {session?.name ? session.name[0].toUpperCase() : '👤'}
            </div>
            <span className="text-[10px] tracking-tight">{session ? 'Perfil' : 'Ingresar'}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
