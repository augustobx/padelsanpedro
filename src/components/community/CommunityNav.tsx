"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Newspaper,
  CalendarDays,
  Search,
  MessageCircle,
  Bell,
} from "lucide-react";

const navItems = [
  { href: "/comunidad", label: "Feed", icon: Newspaper },
  { href: "/comunidad/turnos", label: "Partidos", icon: CalendarDays },
  { href: "/comunidad/jugadores", label: "Jugadores", icon: Search },
  { href: "/comunidad/chat", label: "Chat", icon: MessageCircle },
  { href: "/comunidad/notificaciones", label: "Alertas", icon: Bell },
];

export default function CommunityNav({
  unreadNotifications = 0,
  unreadMessages = 0,
}: {
  unreadNotifications?: number;
  unreadMessages?: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 safe-area-bottom shadow-xl">
      <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/comunidad"
              ? pathname === "/comunidad"
              : pathname.startsWith(item.href);

          const isChat = item.href === "/comunidad/chat";
          const hasChatUnread = isChat && unreadMessages > 0;
          const hasAlert = item.href === "/comunidad/notificaciones" && unreadNotifications > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-[64px]
                ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 font-bold scale-105"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60 active:scale-95"
                }
              `}
            >
              <div className="relative">
                <item.icon
                  className={`w-5 h-5 transition-all ${
                    isActive
                      ? "text-emerald-400 drop-shadow-sm"
                      : ""
                  }`}
                />
                {hasAlert && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-slate-950 animate-pulse" />
                )}
                {hasChatUnread && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black flex items-center justify-center border-2 border-slate-950 animate-pulse shadow-sm">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold leading-tight ${
                  isActive ? "text-emerald-400 font-bold" : ""
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-6 h-0.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
