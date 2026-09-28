'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CalendarSearch,
  ChevronRight,
  Menu,
  Trophy,
  User,
  Users2,
  X,
} from 'lucide-react';

type PublicNavbarSettings = {
  topbarName?: string | null;
  sportEmoji?: string | null;
  clubLogo?: string | null;
  splashLogo?: string | null;
  tournamentsEnabled?: boolean;
  rankingsEnabled?: boolean;
  usersModuleEnabled?: boolean;
  playerCategoriesEnabled?: boolean;
  communityEnabled?: boolean;
};

export default function PublicNavbar({
  sysSettings,
  unreadMessages = 0,
}: {
  sysSettings?: PublicNavbarSettings | null;
  unreadMessages?: number;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const topbarTitle = sysSettings?.topbarName || 'OnlyPadel';
  const logo = sysSettings?.clubLogo || sysSettings?.splashLogo || '';
  const hasLogoImage = /^(https?:\/\/|\/|data:image\/)/i.test(logo);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 md:rounded-t-[2.5rem] relative z-30">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* 1. Brand / Club Name (Resguardado contra desbordes) */}
          <div className="flex items-center min-w-0 flex-1 mr-2">
            <Link
              href={pathname.startsWith('/club/') ? pathname : '/'}
              className="flex items-center gap-2.5 group min-w-0"
              title={topbarTitle}
            >
              {hasLogoImage ? (
                <Image
                  src={logo}
                  alt={topbarTitle}
                  width={34}
                  height={34}
                  unoptimized
                  className="w-8 h-8 object-contain rounded-xl p-0.5 group-hover:scale-105 transition-transform shrink-0 border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform shadow-xs">
                  {sysSettings?.sportEmoji || '🎾'}
                </div>
              )}
              <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight truncate max-w-[190px] sm:max-w-[280px] md:max-w-none">
                {topbarTitle}
              </span>
            </Link>
          </div>

          {/* 2. Desktop Navigation (Pills espaciosas y ordenadas) */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2 shrink-0">
            {pathname !== '/' && !pathname.startsWith('/club/') && (
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 transition-all active:scale-95 shadow-xs shrink-0"
              >
                <CalendarDays className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Sacar Turno</span>
              </Link>
            )}

            {sysSettings?.communityEnabled && (
              <Link
                href="/comunidad"
                className="relative flex items-center gap-1.5 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 px-3 py-1.5 text-xs font-bold text-violet-800 dark:text-violet-300 transition-all hover:bg-violet-100 dark:hover:bg-violet-900/60 active:scale-95"
              >
                <div className="relative flex items-center">
                  <Users2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </div>
                <span>Comunidad</span>
              </Link>
            )}

            {sysSettings?.playerCategoriesEnabled !== false && (
              <Link
                href="/categorias-jugadores"
                className="flex items-center gap-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 px-3 py-1.5 text-xs font-bold text-sky-800 dark:text-sky-300 transition-all hover:bg-sky-100 dark:hover:bg-sky-900/60 active:scale-95"
              >
                <BadgeCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Categorías</span>
              </Link>
            )}

            {sysSettings?.rankingsEnabled !== false && (
              <Link
                href="/ranking"
                className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Ranking</span>
              </Link>
            )}

            {sysSettings?.tournamentsEnabled && (
              <Link
                href="/torneos"
                className="flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 transition-all hover:bg-amber-100 dark:hover:bg-amber-900/60 active:scale-95"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Torneos</span>
              </Link>
            )}

            {sysSettings?.usersModuleEnabled && (
              <Link
                href="/perfil"
                className="flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-3 py-1.5 text-xs font-bold text-blue-800 dark:text-blue-300 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/60 active:scale-95"
              >
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Perfil</span>
              </Link>
            )}

            <Link
              href="/mis-turnos"
              className="flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
            >
              <CalendarSearch className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Mis Turnos</span>
            </Link>
          </div>

          {/* 3. Mobile Navigation: Solo 2 accesos clave + botón Menú (Cero amontonamiento) */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            {sysSettings?.communityEnabled && (
              <Link
                href="/comunidad"
                className="relative p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 transition-all active:scale-95"
                title="Comunidad"
              >
                <Users2 className="w-4 h-4" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white dark:border-slate-900 animate-pulse" />
                )}
              </Link>
            )}

            <Link
              href="/mis-turnos"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all active:scale-95"
              title="Buscar Turnos"
            >
              <CalendarSearch className="w-4 h-4" />
            </Link>

            {/* Toggle Menú Móvil */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-all active:scale-95"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Dropdown Drawer Móvil Limpio y Elegante */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-200 shadow-xl">
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-500/20 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ver todos los clubes (Hub)</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-60" />
          </Link>

          {sysSettings?.rankingsEnabled !== false && (
            <Link
              href="/ranking"
              onClick={closeMenu}
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all"
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span>Ranking Oficial</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </Link>
          )}

          {sysSettings?.playerCategoriesEnabled !== false && (
            <Link
              href="/categorias-jugadores"
              onClick={closeMenu}
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all"
            >
              <div className="flex items-center gap-2.5">
                <BadgeCheck className="w-4 h-4 text-sky-500" />
                <span>Categorías de Jugadores</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </Link>
          )}

          {sysSettings?.tournamentsEnabled && (
            <Link
              href="/torneos"
              onClick={closeMenu}
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Torneos y Cuadros</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </Link>
          )}

          {sysSettings?.usersModuleEnabled && (
            <Link
              href="/perfil"
              onClick={closeMenu}
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all"
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-blue-500" />
                <span>Mi Perfil de Jugador</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
