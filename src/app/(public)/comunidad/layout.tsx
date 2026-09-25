import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/actions/user-auth";
import { redirect } from "next/navigation";
import CommunityNav from "@/components/community/CommunityNav";
import { getUnreadMessagesCount } from "@/actions/community-chat";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authenticated user
  const session = await getUserSession();
  if (!session) {
    redirect("/login-usuario?redirect=/comunidad");
  }

  let unreadNotificationsCount = 0;
  let unreadMessagesCount = 0;
  try {
    const [notifCount, msgCount] = await Promise.all([
      prisma.communityNotification.count({
        where: { userId: session.id, isRead: false },
      }),
      getUnreadMessagesCount(session.id),
    ]);
    unreadNotificationsCount = notifCount;
    unreadMessagesCount = msgCount;
  } catch (e) {
    // Non-critical count
  }

  return (
    <div
      className="dark min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950"
      style={{
        '--color-primary': '#10b981',
        '--color-primary-foreground': '#022c22',
        '--color-secondary': '#06b6d4',
        '--color-secondary-foreground': '#042f38',
      } as React.CSSProperties}
    >
      {/* Top Header - Unified Padel San Pedro Brand */}
      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold text-xs transition-all active:scale-95 group"
              title="Volver al Hub de canchas"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Canchas</span>
            </Link>

            <Link href="/comunidad" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20">
                🎾
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-white">
                  PADEL<span className="text-emerald-400">SANPEDRO</span>
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                  COMUNIDAD
                </span>
              </div>
            </Link>
          </div>

          <Link
            href="/perfil"
            className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 px-3 py-1.5 rounded-2xl transition-all"
            title="Ver mi perfil"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs overflow-hidden border border-emerald-500/30">
              {(session.name || "J")[0].toUpperCase()}
            </div>
            <span className="text-xs font-bold text-white hidden sm:inline max-w-[120px] truncate">
              {session.name}
            </span>
          </Link>
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-5 pb-24">
        {children}
      </main>

      {/* Bottom navigation */}
      <CommunityNav
        unreadNotifications={unreadNotificationsCount}
        unreadMessages={unreadMessagesCount}
      />
    </div>
  );
}
