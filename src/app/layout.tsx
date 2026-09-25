export const dynamic = 'force-dynamic';

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import '@/app/globals.css';
import ConnectivityStatus from '@/components/ConnectivityStatus';
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt';
import { prisma } from '@/lib/prisma';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "Padel San Pedro — App Multicancha & Comunidad",
  description: "Todas las canchas de pádel de San Pedro en una sola app: reservas de turnos en tiempo real, alertas de turnos liberados, partidos abiertos, torneos y ranking oficial.",
  manifest: "/manifest.json",
  applicationName: "Padel San Pedro",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Padel San Pedro',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

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
        <PwaInstallPrompt />
        {children}
      </body>
    </html>
  );
}
