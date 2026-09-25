export const dynamic = 'force-dynamic';

import { getPublicCourts } from "@/actions/public-bookings";
import { getSettings } from "@/actions/settings";
import { getPublicTournaments } from "@/actions/public-tournaments";
import BookingFlow from "@/components/BookingFlow";
import BookingFlowChat from "@/components/BookingFlowChat";
import PublicNavbar from "@/components/PublicNavbar";
import Link from "next/link";
import { Trophy, ChevronRight, ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import UserWelcomeSplash from "@/components/UserWelcomeSplash";
import { getUserSession } from "@/actions/user-auth";
import { getReadableForeground, getThemeColors } from "@/lib/color";
import { resolveTenantBySlug, TenantResolutionError } from "@/lib/tenant-context";
import { notFound, redirect } from "next/navigation";
import { getLatestCommunityPosts } from "@/actions/community-feed";
import { getUnreadMessagesCount } from "@/actions/community-chat";
import CommunityFeedTicker from "@/components/community/CommunityFeedTicker";
import { hasTenantFeature } from "@/lib/features";

interface ClubPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { slug } = await params;

  try {
    await resolveTenantBySlug(slug);
  } catch (error) {
    if (error instanceof TenantResolutionError && error.message === 'TENANT_SUSPENDED') {
      redirect('/suspendido');
    }
    notFound();
  }

  const pubReq = await getPublicTournaments();
  const activeTournament = pubReq.data?.find((t) => t.status !== 'COMPLETED');

  const courtsRes = await getPublicCourts();
  const courts = courtsRes?.success && courtsRes?.data ? courtsRes.data : [];

  const settings = await getSettings();
  const theme = settings?.theme || 'light';
  const themeData = getThemeColors(theme, settings?.primaryColor, settings?.secondaryColor);
  const themeClass = themeData.themeClass;
  const primaryColor = themeData.primary;
  const secondaryColor = themeData.secondary;
  const appLayout = settings?.appLayout || 'classic';

  const isReservationsEnabled = settings?.reservationsEnabled ?? true;
  const isWhatsappReservations = settings?.whatsappReservations ?? true;
  const usersModuleEnabled = settings?.usersModuleEnabled ?? false;

  const session = await getUserSession();
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const isCommunityActive = settings?.communityEnabled && (await hasTenantFeature('community').catch(() => false));
  let unreadMessages = 0;
  let latestCommunityPosts: any[] = [];
  if (isCommunityActive) {
    if (session?.id) {
      unreadMessages = await getUnreadMessagesCount(session.id);
    }
    latestCommunityPosts = await getLatestCommunityPosts(3);
  }

  if (usersModuleEnabled) {
    const cookieStore = await cookies();
    const hasSession = !!session;
    const hasSkipped = cookieStore.get('onlypadel_skip_registration');

    if (!hasSession && !hasSkipped) {
      return (
        <div data-theme={theme} className={themeClass}>
          <UserWelcomeSplash />
        </div>
      );
    }
  }

  if (!isReservationsEnabled) {
    const phoneToUse = settings?.apiPhone || settings?.contactPhone || '';
    const phone = phoneToUse.replace(/\D/g, '');
    const waLink = `https://wa.me/${phone}?text=Hola,%20quiero%20reservar%20un%20turno.`;

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${themeClass || (theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100')}`}>
        <div className={`max-w-md w-full rounded-3xl shadow-xl p-8 text-center border ${theme === 'dark' || themeClass.includes('dark') ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="mb-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a PadelSanPedro
            </Link>
          </div>
          <h1 className="text-2xl font-black mb-2">Reservas Pausadas</h1>
          <p className={`mb-8 font-medium ${theme === 'dark' || themeClass.includes('dark') ? 'text-slate-400' : 'text-slate-500'}`}>
            El sistema automático de turnos de este complejo se encuentra desactivado momentáneamente.
          </p>

          {isWhatsappReservations && phone && (
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="block w-full">
              <button className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                Reservar por WhatsApp
              </button>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      data-theme={theme}
      className={`${themeClass} min-h-dvh bg-[var(--background,#f8fafc)] text-[var(--foreground,#0f172a)] flex flex-col md:h-dvh md:items-center md:overflow-hidden md:py-4 transition-colors duration-300`}
      style={{
        '--color-primary': primaryColor,
        '--color-primary-foreground': getReadableForeground(primaryColor),
        '--color-secondary': secondaryColor,
        '--color-secondary-foreground': getReadableForeground(secondaryColor),
      } as React.CSSProperties}
    >
      <div className="relative flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-[var(--card,#ffffff)] text-[var(--card-foreground,#0f172a)] md:h-[calc(100dvh-2rem)] md:max-h-[860px] md:min-h-0 md:rounded-[2.5rem] md:border md:border-[var(--border,#e2e8f0)] md:shadow-2xl transition-colors duration-300">
        
        {/* Barra superior de retorno al Lobby de Padel San Pedro */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold shrink-0 z-40 border-b border-slate-800">
          <Link href="/" className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>PadelSanPedro</span>
          </Link>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold text-[11px] truncate max-w-[180px]">
            {settings?.clubName || 'Club'}
          </span>
        </div>

        <PublicNavbar sysSettings={settings} unreadMessages={unreadMessages} />
        
        {settings?.tournamentsEnabled && activeTournament && (
          <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-4 py-2 text-white shadow-sm z-30 shrink-0 border-b border-amber-600/30">
            <Link href={`/torneos/${activeTournament.id}`} className="flex items-center justify-between gap-2 hover:opacity-95 transition-opacity">
              <div className="flex items-center gap-2 min-w-0">
                <Trophy className="w-4 h-4 text-yellow-100 animate-bounce shrink-0" />
                <span className="text-xs font-black tracking-wide truncate">
                  {activeTournament.status === 'ONGOING' ? '¡Torneo en Juego!' : '¡Torneo Disponible!'} {activeTournament.name}
                </span>
              </div>
              <span className="bg-black/20 hover:bg-black/30 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 flex items-center gap-1 transition-colors">
                Ver <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        )}

        <CommunityFeedTicker posts={latestCommunityPosts} isCommunityActive={!!isCommunityActive} />
        
        {appLayout === 'chat' ? (
          <BookingFlowChat courts={courts} sysSettings={settings} session={session} today={today} />
        ) : (
          <BookingFlow courts={courts} sysSettings={settings} session={session} today={today} />
        )}
      </div>
    </div>
  );
}
