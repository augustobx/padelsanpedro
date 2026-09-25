"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  MessageCircle,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  UserX,
} from "lucide-react";
import type { OpenMatchCardData, UserUpcomingBookingOption } from "@/actions/community-matches";
import {
  joinOpenMatch,
  leaveOpenMatch,
  cancelOpenMatch,
  removePlayerFromOpenMatch,
  createOpenMatchFromBooking,
} from "@/actions/community-matches";
import type { PreferredPosition } from "@prisma/client";

export default function OpenMatchesClient({
  initialMatches,
  currentUserId,
  userBookings = [],
}: {
  initialMatches: OpenMatchCardData[];
  currentUserId: string | null;
  userBookings?: UserUpcomingBookingOption[];
}) {
  const [matches, setMatches] = useState<OpenMatchCardData[]>(initialMatches);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [filterDate, setFilterDate] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Estado para el modal de convocatoria ligada a una reserva real
  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    userBookings?.[0]?.id || ""
  );
  const [formSlots, setFormSlots] = useState<number>(1);
  const [formLevel, setFormLevel] = useState("");
  const [formPosition, setFormPosition] = useState<PreferredPosition | "">("");
  const [formDescription, setFormDescription] = useState("");

  // Mantener preseleccionado el primer turno si cambia userBookings
  useEffect(() => {
    if (userBookings.length > 0 && !selectedBookingId) {
      setSelectedBookingId(userBookings[0].id);
    }
  }, [userBookings, selectedBookingId]);

  const handleJoin = (matchId: string) => {
    if (!currentUserId) {
      router.push("/login-usuario");
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await joinOpenMatch(matchId);
      if (res.success) {
        setMatches((prev) =>
          prev.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  hasJoined: true,
                  slotsNeeded: Math.max(0, m.slotsNeeded - 1),
                  status: m.slotsNeeded <= 1 ? "FULL" : m.status,
                }
              : m
          )
        );
        setActionSuccess("¡Te anotaste exitosamente al partido!");
        setTimeout(() => setActionSuccess(null), 3500);
        router.refresh();
      } else {
        setActionError(res.error || "No se pudo unir al turno.");
      }
    });
  };

  const handleLeave = (matchId: string) => {
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await leaveOpenMatch(matchId);
      if (res.success) {
        setMatches((prev) =>
          prev.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  hasJoined: false,
                  slotsNeeded: m.slotsNeeded + 1,
                  status: "OPEN",
                }
              : m
          )
        );
        setActionSuccess("Te diste de baja del partido.");
        setTimeout(() => setActionSuccess(null), 3500);
        router.refresh();
      } else {
        setActionError(res.error || "Error al abandonar el turno.");
      }
    });
  };

  const handleRemovePlayer = (matchId: string, targetUserId: string, playerName: string) => {
    if (!confirm(`¿Deseas dar de baja a ${playerName} de la convocatoria? Se liberará el cupo.`)) return;
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await removePlayerFromOpenMatch(matchId, targetUserId);
      if (res.success) {
        setMatches((prev) =>
          prev.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  players: m.players.filter((p) => p.user.id !== targetUserId),
                  slotsNeeded: m.slotsNeeded + 1,
                  status: "OPEN",
                }
              : m
          )
        );
        setActionSuccess(`Jugador ${playerName} removido de la convocatoria.`);
        setTimeout(() => setActionSuccess(null), 3500);
        router.refresh();
      } else {
        setActionError(res.error || "No se pudo remover al jugador.");
      }
    });
  };

  const handleCancel = (matchId: string) => {
    if (!confirm("¿Deseas cancelar esta convocatoria?")) return;
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await cancelOpenMatch(matchId);
      if (res.success) {
        setMatches((prev) => prev.filter((m) => m.id !== matchId));
        setActionSuccess("Convocatoria cancelada.");
        setTimeout(() => setActionSuccess(null), 3500);
        router.refresh();
      } else {
        setActionError(res.error || "No se pudo cancelar el turno.");
      }
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      router.push("/login-usuario?redirect=/comunidad/turnos");
      return;
    }

    if (!selectedBookingId) {
      setActionError("Seleccioná uno de tus turnos reservados para convocar jugadores.");
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const res = await createOpenMatchFromBooking({
        bookingId: selectedBookingId,
        slotsNeeded: formSlots,
        level: formLevel.trim() || undefined,
        positionNeeded: (formPosition as PreferredPosition) || undefined,
        description: formDescription.trim() || undefined,
      });

      if (res.success) {
        setShowCreateModal(false);
        setActionSuccess(
          res.updated
            ? "¡Convocatoria actualizada con éxito!"
            : "¡Convocatoria publicada! Tu turno ya está disponible en Turnos Armados y en el Muro."
        );
        setTimeout(() => setActionSuccess(null), 5000);
        router.refresh();
      } else {
        setActionError(res.error || "Error al crear la convocatoria.");
      }
    });
  };

  // Filtrado de turnos
  const filteredMatches = matches.filter((m) => {
    if (filterLevel !== "ALL" && m.level && !m.level.includes(filterLevel)) {
      return false;
    }
    if (filterDate === "TODAY") {
      const todayStr = new Date().toISOString().split("T")[0];
      const matchStr = new Date(m.date).toISOString().split("T")[0];
      if (todayStr !== matchStr) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Banner Superior & CTA */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-950 text-white shadow-xl shadow-emerald-950/30 border border-emerald-600/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-36 h-36 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-black uppercase tracking-wider border border-emerald-400/30">
                Partidos Abiertos
              </span>
              <span className="text-xs text-white/80">
                {filteredMatches.length} convocatoria{filteredMatches.length !== 1 ? "s" : ""}
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight">
              ¿Te falta uno para el partido? 🎾
            </h2>
            <p className="text-xs text-slate-200 max-w-md mt-1">
              Convocatorias para partidos ya reservados en los clubes de San Pedro. Anotate o coordiná directamente con el organizador.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black backdrop-blur-md border border-white/20 active:scale-95 transition-all shadow-sm"
              title="Ir a ver canchas disponibles"
            >
              <CalendarDays className="w-4 h-4 text-emerald-300" />
              <span>Canchas</span>
            </Link>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-950/40 hover:bg-emerald-300 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              Convocar Jugadores
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Éxito si ocurre */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Alerta de Error si ocurre */}
      {actionError && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-2.5 rounded-2xl border border-slate-800 shadow-sm text-xs">
        <span className="text-slate-400 font-semibold px-2">Filtros:</span>

        {/* Filtro Fecha */}
        <button
          onClick={() => setFilterDate("ALL")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filterDate === "ALL"
              ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
              : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          Todos los días
        </button>
        <button
          onClick={() => setFilterDate("TODAY")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filterDate === "TODAY"
              ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
              : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          Solo Hoy
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Filtro Nivel */}
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none"
        >
          <option value="ALL">Cualquier Categoría</option>
          <option value="7ma">7ma Categoría</option>
          <option value="6ta">6ta Categoría</option>
          <option value="5ta">5ta Categoría</option>
          <option value="4ta">4ta Categoría</option>
          <option value="3ra">3ra Categoría</option>
          <option value="Principiante">Principiante</option>
        </select>
      </div>

      {/* Lista de Turnos */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl">
            🎾
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            No hay convocatorias activas
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            ¿Tenés un turno reservado y te falta gente para jugar? Publicalo en segundos, o reservá una cancha en el club.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold hover:bg-slate-750 active:scale-95 transition-all"
            >
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              Sacar Turno en Canchas
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Crear convocatoria
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMatches.map((match) => {
            const matchDate = new Date(match.date);
            const dateStr = matchDate.toLocaleDateString("es-AR", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            const isFull = match.status === "FULL" || match.slotsNeeded === 0;
            const organizerName = `${match.creator.name || ""} ${
              match.creator.lastName || ""
            }`.trim() || "Organizador";

            return (
              <div
                key={match.id}
                className={`bg-slate-900 rounded-3xl border p-4.5 shadow-md flex flex-col justify-between transition-all ${
                  isFull
                    ? "border-slate-800 opacity-75"
                    : "border-emerald-500/40 ring-1 ring-emerald-500/20 hover:border-emerald-500/60"
                }`}
              >
                <div>
                  {/* Encabezado: Fecha, Cancha y Badge de Vacantes */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-white">
                        <CalendarDays className="w-4 h-4 text-emerald-400" />
                        <span className="capitalize">{dateStr}</span>
                        <span className="text-slate-500">•</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {match.startTime} - {match.endTime} hs
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span className="font-semibold text-slate-300">{match.courtName}</span>
                      </div>
                    </div>

                    {/* Badge de Vacantes */}
                    {isFull ? (
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        Completo
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider animate-pulse">
                        ¡Falta {match.slotsNeeded}!
                      </span>
                    )}
                  </div>

                  {/* Etiquetas: Nivel & Posición */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {match.level && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        {match.level}
                      </span>
                    )}
                    {match.positionNeeded && (
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-400 text-[10px] font-bold border border-cyan-500/30">
                        Posición: {match.positionNeeded}
                      </span>
                    )}
                  </div>

                  {/* Descripción / Mensaje del Host */}
                  {match.description && (
                    <p className="text-xs text-slate-300 italic bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 mb-3">
                      &quot;{match.description}&quot;
                    </p>
                  )}

                  {/* Organizador y Jugadores anotados */}
                  <div className="pt-2 border-t border-slate-800 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {match.creator.avatarUrl ? (
                          <div className="w-6 h-6 rounded-full overflow-hidden relative">
                            <Image
                              src={match.creator.avatarUrl}
                              alt={organizerName}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                            {(match.creator.name || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="text-[11px] font-bold text-white">
                            {organizerName}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            (Host)
                          </span>
                        </div>
                      </div>

                      {match.creator.category && (
                        <span className="text-[10px] font-bold text-emerald-400">
                          Cat. {match.creator.category}
                        </span>
                      )}
                    </div>

                    {/* Jugadores que ya se sumaron */}
                    {match.players.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Users className="w-3 h-3 text-emerald-400" />
                            Jugadores Anotados ({match.players.length})
                          </span>
                          {match.isCreator && (
                            <span className="text-[10px] text-emerald-400 font-bold">
                              Tu convocatoria
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {match.players.map((p) => {
                            const pName = `${p.user.name || "Jugador"} ${p.user.lastName || ""}`.trim();
                            const isMe = p.user.id === currentUserId;

                            return (
                              <div
                                key={p.id}
                                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {p.user.avatarUrl ? (
                                    <div className="w-6 h-6 rounded-full overflow-hidden relative shrink-0">
                                      <Image
                                        src={p.user.avatarUrl}
                                        alt={pName}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                                      {(p.user.name || "?")[0].toUpperCase()}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white truncate">
                                      {pName} {isMe && "(Vos)"}
                                    </span>
                                    {p.user.category && (
                                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300 shrink-0">
                                        Cat. {p.user.category}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  {/* Chat directo con el jugador */}
                                  {!isMe && (
                                    <Link
                                      href={`/comunidad/chat?to=${p.user.id}`}
                                      className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-colors"
                                      title={`Enviar mensaje a ${pName}`}
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </Link>
                                  )}

                                  {/* Creador puede eliminar a un anotado */}
                                  {match.isCreator && !isMe && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePlayer(match.id, p.user.id, pName)}
                                      disabled={isPending}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black text-rose-400 hover:bg-rose-950/60 border border-rose-800/60 transition-all active:scale-95 shadow-xs"
                                      title="Quitar jugador de la convocatoria y liberar cupo"
                                    >
                                      <UserX className="w-3 h-3" />
                                      <span>Quitar</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  {match.isCreator ? (
                    <button
                      onClick={() => handleCancel(match.id)}
                      disabled={isPending}
                      className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Cancelar mi convocatoria
                    </button>
                  ) : match.hasJoined ? (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/comunidad/chat?to=${match.creator.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chat con Host
                      </Link>
                      <button
                        onClick={() => handleLeave(match.id)}
                        disabled={isPending}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        Darme de baja
                      </button>
                    </div>
                  ) : (
                    <Link
                      href={`/comunidad/chat?to=${match.creator.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Consultar por Chat
                    </Link>
                  )}

                  {!match.isCreator && !match.hasJoined && !isFull && (
                    <button
                      onClick={() => handleJoin(match.id)}
                      disabled={isPending}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      ¡Me anoto!
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Convocatoria - Exclusivo para turnos ya sacados */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <CalendarDays className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">
                    Buscar Personas para Jugar
                  </h3>
                  <p className="text-xs text-slate-400">
                    Convocatoria oficial para turnos reservados
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Caso 1: No está logueado */}
            {!currentUserId ? (
              <div className="text-center py-6 px-2 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-3xl shadow-inner border border-amber-500/30">
                  🔒
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-white">
                    Iniciá sesión para convocar
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Para buscar personas o convocar compañeros, ingresá con tu cuenta para acceder a tus turnos reservados.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/login-usuario?redirect=/comunidad/turnos"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    Iniciar Sesión
                  </Link>
                </div>
              </div>
            ) : userBookings.length === 0 ? (
              /* Caso 2: Logueado pero SIN turnos reservados */
              <div className="text-center py-6 px-2 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-3xl shadow-inner border border-amber-500/30">
                  📅
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-white">
                    No tenés turnos reservados
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Para buscar personas o convocar compañeros, primero necesitás tener una cancha reservada en el club. Reservá tu turno para buscar personas.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span>Reservá para buscar personas 🎾</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Caso 3: Tiene turnos reservados */
              <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">
                    Elegí tu turno reservado:
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {userBookings.map((b) => {
                      const isSelected = selectedBookingId === b.id;
                      return (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => setSelectedBookingId(b.id)}
                          className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                              : "bg-slate-800/80 border-slate-700 hover:border-slate-600"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 font-black text-white">
                              <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{b.courtName}</span>
                              <span className="text-slate-500">•</span>
                              <span className="capitalize">{b.dateFormatted}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{b.timeFormatted}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {b.alreadyPublished && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Publicado
                              </span>
                            )}
                            <span
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-500 text-slate-950"
                                  : "border-slate-600"
                              }`}
                            >
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                              )}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">
                    ¿Cuántos jugadores faltan?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormSlots(num)}
                        className={`py-2 rounded-xl font-bold border transition-all ${
                          formSlots === num
                            ? "bg-emerald-500 text-slate-950 border-emerald-500 font-black shadow-sm"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                        }`}
                      >
                        Falta {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">
                      Nivel / Categoría
                    </label>
                    <input
                      type="text"
                      value={formLevel}
                      onChange={(e) => setFormLevel(e.target.value)}
                      placeholder="Ej: 6ta pareja, 5ta..."
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 font-medium text-white placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">
                      Posición Buscada
                    </label>
                    <select
                      value={formPosition}
                      onChange={(e) => setFormPosition(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 font-medium text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                      <option value="">Cualquiera</option>
                      <option value="DRIVE">Drive</option>
                      <option value="REVES">Revés</option>
                      <option value="AMBOS">Indistinto</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">
                    Nota o Mensaje para el Muro
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ej: Picadito parejo y con buena onda, nos falta uno a último momento..."
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 font-medium text-white placeholder:text-slate-500 resize-none focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 font-bold hover:text-white hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !selectedBookingId}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Publicar en la Comunidad 🚀
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
