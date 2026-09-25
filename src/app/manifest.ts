export const dynamic = 'force-dynamic';

import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { isPlatformRequest } from '@/lib/tenant-context'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const isPlatform = await isPlatformRequest()
  const settings = !isPlatform ? await prisma.systemSetting.findFirst({ where: { id: 1 } }) : null
  const appName = isPlatform ? 'Padel San Pedro' : (settings?.clubName || 'Padel San Pedro')
  const description = isPlatform
    ? 'Todas las canchas, reservas en tiempo real, comunidad y ranking de pádel en San Pedro'
    : `Reserva tu cancha en ${appName} a través de Padel San Pedro`

  const icons: MetadataRoute.Manifest['icons'] = [
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: '/icons/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
  ]

  const shortcuts = [
    {
      name: 'Ver Canchas & Turnos',
      short_name: 'Turnos',
      description: 'Lobby multicancha con turnos en tiempo real',
      url: '/',
      icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
    },
    {
      name: 'Comunidad San Pedro',
      short_name: 'Comunidad',
      description: 'Muro social, avisos de partidos y charlas',
      url: '/comunidad',
      icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
    },
    {
      name: 'Partidos Abiertos',
      short_name: 'Partidos',
      description: 'Buscá jugadores o sumate a un partido',
      url: '/comunidad/partidos',
      icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
    },
    {
      name: 'Mis Reservas',
      short_name: 'Mis Turnos',
      description: 'Consultar tus reservas activas',
      url: '/mis-turnos',
      icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
    },
  ]

  return {
    name: isPlatform ? 'Padel San Pedro — Hub Multicancha' : `${appName} — Padel San Pedro`,
    short_name: appName,
    description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    background_color: '#020617',
    theme_color: '#020617',
    orientation: 'portrait-primary',
    categories: ['sports', 'social', 'lifestyle'],
    icons,
    shortcuts,
  }
}
