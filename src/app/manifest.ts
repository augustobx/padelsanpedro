export const dynamic = 'force-dynamic';

import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { isPlatformRequest } from '@/lib/tenant-context'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  if (await isPlatformRequest()) {
    return {
      name: 'PadelSanPedro',
      short_name: 'PadelSanPedro',
      description: 'Reservas de canchas, comunidad y torneos de pádel en San Pedro',
      start_url: '/',
      display: 'standalone',
      background_color: '#020617',
      theme_color: '#10b981',
      orientation: 'portrait-primary',
      icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
    }
  }
  const settings = await prisma.systemSetting.findFirst({ where: { id: 1 } })
  const appName = settings?.clubName || 'PadelSanPedro'

  return {
    name: `${appName} — PadelSanPedro`,
    short_name: appName,
    description: `Reserva tu cancha en ${appName} a través de PadelSanPedro`,
    start_url: '/',
    display: 'standalone',
    background_color: settings?.theme === 'dark' ? '#020617' : '#f8fafc',
    theme_color: settings?.primaryColor || '#10b981',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/globe_192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/globe_512.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  }
}
