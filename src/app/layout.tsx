export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import '@/app/globals.css';
import ConnectivityStatus from '@/components/ConnectivityStatus';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PadelSanPedro — App Multicancha & Comunidad",
  description: "Todas las canchas de pádel de San Pedro en una sola app: reservas de turnos, partidos abiertos, torneos y ranking oficial.",
  manifest: "/manifest.json",
};

import { prisma } from '@/lib/prisma';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let themeClass = 'dark';
  let themeName = 'dark';
  try {
    const settings = await prisma.systemSetting.findFirst({ where: { id: 1 }, select: { theme: true } });
    if (settings?.theme) {
      themeName = settings.theme;
      if (['cyber-padel', 'sunset-clay', 'ocean-frost'].includes(settings.theme)) {
        themeClass = `dark theme-${settings.theme}`;
      } else if (settings.theme === 'light') {
        // Individual tenant pages handle their own light themes explicitly
        themeClass = 'dark';
      }
    }
  } catch {}

  return (
    <html
      lang="es"
      suppressHydrationWarning
      data-theme={themeName}
      className={`${geistSans.variable} ${geistMono.variable} ${themeClass} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
        <ConnectivityStatus />
        {children}
      </body>
    </html>
  );
}
