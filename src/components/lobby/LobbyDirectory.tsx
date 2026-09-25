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
} from 'lucide-react';
import type { PublicClubCard, HubHighlights } from '@/actions/clubs';
import PwaNotificationBell from '@/components/pwa/PwaNotificationBell';

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
}

export default function LobbyDirectory({
  clubs,
  session,
  hubHighlights,
  recentPostsCount = 0,
  openMatchesCount = 0,
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

  const userDisplayName = session?.name
    ? `${session.name} ${session.lastName || ''}`.trim()
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-12">
      {/* Top Header / Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-xl">
              🎾
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white">
                  PADEL<span className="text-emerald-400">SANPEDRO</span>
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                  HUB
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" /> San Pedro, Bs. As.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PwaNotificationBell />
            {session ? (
              <Link
                href="/perfil"
                className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 px-3 py-1.5 rounded-2xl transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs overflow-hidden border border-emerald-500/30">
                  {session.avatarUrl ? (
                    <img src={session.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (session.name || 'J')[0].toUpperCase()
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">{session.name}</p>
                  <p className="text-[10px] text-emerald-400 font-semibold">{session.category || 'Jugador'}</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login-usuario"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/15"
                >
                  Ingresar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-5 space-y-6">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 sm:p-8">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" /> La red de canchas de San Pedro
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Elegí tu complejo favorito y <span className="text-emerald-400">reservá tu turno</span> al instante.
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-400 font-medium">
              Conectate con todos los clubes de la ciudad, sumate a partidos abiertos y seguí el ranking oficial desde una sola app.
            </p>

            {/* Quick Live Indicators */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
              <span className="inline-flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl">
                🎾 <strong>{hubHighlights?.todayAvailableCount ? `${hubHighlights.todayAvailableCount}+` : `${clubs.length * 6}+`}</strong> turnos disponibles hoy en San Pedro
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
                  ⚡ Grillas actualizadas en tiempo real
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Sección de Turnos Liberados Hoy (Avisos de última hora en el Hub) */}
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

            <div className="mt-4 pt-3.5 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-amber-200/90 font-medium flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                ¿Querés que tu celular te avise al instante cuando alguien libere un turno?
              </span>
              <PwaNotificationBell />
            </div>
          </section>
        )}

        {/* Quick Hub Modules Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="#complejos"
            className="flex flex-col p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 transition-all hover:border-emerald-500/40 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
              Reservar Cancha
            </span>
            <span className="text-xs text-slate-400 mt-0.5">{clubs.length} complejos activos</span>
          </Link>

          <Link
            href="/comunidad?tab=partidos"
            className="flex flex-col p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 transition-all hover:border-cyan-500/40 group"
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
            className="flex flex-col p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 transition-all hover:border-purple-500/40 group"
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
            className="flex flex-col p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 transition-all hover:border-amber-500/40 group"
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

        {/* Directory Header & Filters */}
        <section id="complejos" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Complejos y Canchas
                <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  {filteredClubs.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Seleccioná un club para ver la grilla de turnos y reservar</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedFilter === 'all'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedFilter('indoor')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedFilter === 'indoor'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Techadas / Indoor
              </button>
              <button
                onClick={() => setSelectedFilter('synthetic')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedFilter === 'synthetic'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
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
              placeholder="Buscar club por nombre o superficie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
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
                  : 'Aún no hay clubes configurados en la plataforma. Podés administrarlos desde el panel SuperAdmin.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedFilter('all');
                  }}
                  className="mt-4 text-xs font-bold text-emerald-400 hover:underline"
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
                  className="overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-lg shadow-black/20"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                    
                    {/* Badges on image */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1 rounded-xl border border-white/10 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-emerald-400" />
                        {club.courtsCount} {club.courtsCount === 1 ? 'Cancha' : 'Canchas'}
                      </span>
                      {club.hasIndoor && (
                        <span className="bg-emerald-500/90 text-slate-950 text-[10px] font-black px-2 py-1 rounded-xl shadow-md">
                          Indoor Techado
                        </span>
                      )}
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

                    {/* Action button */}
                    <Link
                      href={`/club/${club.slug}`}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 group/btn shadow-md shadow-emerald-500/10 active:scale-[0.98]"
                    >
                      <span>Ver Canchas y Turnos</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Call to action for San Pedro Players */}
        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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

        {/* Footer */}
        <footer className="pt-8 pb-16 text-center text-xs text-slate-500 space-y-2 border-t border-slate-900/80">
          <p>© 2026 PadelSanPedro · La red de canchas de San Pedro</p>
          <div className="flex items-center justify-center gap-4 text-[11px]">
            <Link href="/login" className="text-slate-400 hover:text-emerald-400 font-semibold transition-colors flex items-center gap-1">
              <Lock className="w-3 h-3" /> Acceso Clubes
            </Link>
          </div>
        </footer>
      </main>

      {/* Bottom Navigation Bar for Mobile (PWA App Experience) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 md:hidden">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1 text-center">
          <Link
            href="/"
            className="flex flex-col items-center py-1 text-emerald-400 font-bold transition-colors"
          >
            <Calendar className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight">Canchas</span>
          </Link>

          <Link
            href="/comunidad/turnos"
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
