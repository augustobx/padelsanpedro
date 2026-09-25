import Link from 'next/link';
import { ArrowLeft, BarChart3, Crown, Medal, Trophy, UserRound, Users } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/actions/user-auth';
import { rankingDisplayName, sortRankingEntries } from '@/lib/rankings';

export const metadata = {
  title: 'Ranking Oficial — Padel San Pedro',
  description: 'Tabla oficial de posiciones, puntos y categorías de jugadores de pádel de San Pedro.',
};

export default async function PublicRankingPage() {
  const [settings, session] = await Promise.all([
    prisma.systemSetting.findFirst({ where: { id: 1 } }),
    getUserSession(),
  ]);

  const categories = settings?.rankingsEnabled === false ? [] : await prisma.rankingCategory.findMany({
    where: { isPublished: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: {
      entries: {
        include: { user: { select: { id: true, name: true, lastName: true } } },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Platform Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2 text-white font-black text-lg tracking-tight hover:opacity-90 transition-opacity">
              <span>🎾</span>
              <span>PADEL<span className="text-emerald-400">SANPEDRO</span></span>
            </Link>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
              Ranking
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Volver a</span> Canchas
            </Link>
            <Link
              href="/comunidad"
              className="inline-flex items-center gap-1.5 text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Comunidad</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
                <Trophy className="w-3.5 h-3.5" />
                <span>Ranking Oficial Ciudad de San Pedro</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Tabla de Posiciones y Rendimiento
              </h1>
              <p className="mt-1 text-sm text-slate-400 max-w-xl">
                Consultá los puntos, partidos jugados y rendimiento actualizado de cada categoría en todos los clubes de la ciudad.
              </p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center">
                <div className="text-xl font-black text-amber-400">{categories.length}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categorías</div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories List */}
        {settings?.rankingsEnabled === false ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <h2 className="text-lg font-black text-white">El ranking está temporalmente en mantenimiento</h2>
            <p className="mt-1 text-sm text-slate-400">Volvé a consultar más adelante.</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <h2 className="text-lg font-black text-white">Todavía no hay rankings publicados</h2>
            <p className="mt-1 text-sm text-slate-400">Las nuevas posiciones aparecerán acá cuando se carguen los torneos y partidos.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => {
              const entries = sortRankingEntries(category.entries, category.sortMode);
              return (
                <section
                  key={category.id}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 bg-slate-850 px-5 py-4">
                    <div>
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <span>{category.name}</span>
                      </h2>
                      {category.description && (
                        <p className="mt-0.5 text-xs text-slate-400">{category.description}</p>
                      )}
                    </div>
                    <span className="w-fit rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-black text-emerald-400">
                      {entries.length} {entries.length === 1 ? 'jugador' : 'jugadores'}
                    </span>
                  </div>

                  {entries.length === 0 ? (
                    <p className="p-8 text-center text-sm text-slate-500">
                      No hay posiciones cargadas en esta categoría aún.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-sm">
                        <thead className="border-b border-slate-800 text-[11px] uppercase tracking-widest text-slate-400 bg-slate-900/60">
                          <tr>
                            <th className="w-16 px-4 py-3 text-center">Pos.</th>
                            <th className="px-4 py-3 text-left">Jugador</th>
                            {category.showPoints && <th className="px-4 py-3 text-center">Pts</th>}
                            {category.showPlayed && <th className="px-4 py-3 text-center">PJ</th>}
                            {category.showWon && <th className="px-4 py-3 text-center">PG</th>}
                            {category.showLost && <th className="px-4 py-3 text-center">PP</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {entries.map((entry, index) => {
                            const isCurrentUser = Boolean(session?.id && entry.userId === session.id);
                            return (
                              <tr
                                key={entry.id}
                                className={`transition-colors ${
                                  isCurrentUser
                                    ? 'bg-emerald-500/15 text-white'
                                    : 'hover:bg-slate-800/50 text-slate-200'
                                }`}
                              >
                                <td className="px-4 py-3.5 text-center">
                                  <span
                                    className={`relative inline-flex h-8 w-8 items-center justify-center rounded-xl font-black text-xs ${
                                      index === 0
                                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-300'
                                        : index === 1
                                        ? 'bg-slate-300 text-slate-950'
                                        : index === 2
                                        ? 'bg-amber-700/80 text-white'
                                        : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                                    }`}
                                  >
                                    {index === 0 ? (
                                      <>
                                        <Crown className="absolute -top-2.5 h-3.5 w-3.5 text-amber-300" />
                                        1
                                      </>
                                    ) : index < 3 ? (
                                      <Medal className="h-4 w-4" />
                                    ) : (
                                      index + 1
                                    )}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold">
                                      {rankingDisplayName(entry)[0]?.toUpperCase() || <UserRound className="h-4 w-4" />}
                                    </span>
                                    <div>
                                      <strong className="block text-white font-bold leading-tight">
                                        {rankingDisplayName(entry)}
                                      </strong>
                                      <small className="text-[11px] text-slate-400">
                                        {entry.user ? 'Jugador registrado' : 'Participante'}{isCurrentUser ? ' · Vos' : ''}
                                      </small>
                                    </div>
                                  </div>
                                </td>
                                {category.showPoints && (
                                  <td className="px-4 py-3.5 text-center text-base font-black text-emerald-400">
                                    {entry.points}
                                  </td>
                                )}
                                {category.showPlayed && (
                                  <td className="px-4 py-3.5 text-center font-semibold text-slate-300">
                                    {entry.matchesPlayed}
                                  </td>
                                )}
                                {category.showWon && (
                                  <td className="px-4 py-3.5 text-center font-bold text-emerald-400">
                                    {entry.matchesWon}
                                  </td>
                                )}
                                {category.showLost && (
                                  <td className="px-4 py-3.5 text-center font-bold text-rose-400">
                                    {entry.matchesLost}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
