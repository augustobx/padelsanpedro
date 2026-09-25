'use server';

import { platformPrisma } from '@/lib/prisma-core';
import { cookies } from 'next/headers';

export interface PublicClubCard {
  id: string;
  slug: string;
  name: string;
  contactPhone: string;
  heroImage: string | null;
  primaryColor: string;
  courtsCount: number;
  surfaces: string[];
  hasIndoor: boolean;
  status: string;
}

export async function getPublicClubs(): Promise<PublicClubCard[]> {
  try {
    const tenants = await platformPrisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        systemSetting: {
          select: {
            clubName: true,
            contactPhone: true,
            courtPhone: true,
            heroImage: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
        courts: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            surface: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return tenants.map((t) => {
      const courts = t.courts || [];
      const surfaces = Array.from(new Set(courts.map((c) => c.surface).filter(Boolean)));

      return {
        id: t.id,
        slug: t.slug,
        name: t.systemSetting?.clubName || t.name,
        contactPhone: t.systemSetting?.contactPhone || t.systemSetting?.courtPhone || '',
        heroImage: t.systemSetting?.heroImage || null,
        primaryColor: t.systemSetting?.primaryColor || '#10b981',
        courtsCount: courts.length,
        surfaces,
        hasIndoor: surfaces.some((s) => s.toLowerCase().includes('tech') || s.toLowerCase().includes('indoor')),
        status: t.status,
      };
    });
  } catch (error) {
    console.error('Error fetching public clubs:', error);
    return [];
  }
}

export async function setActiveClub(slug: string) {
  const cookieStore = await cookies();
  cookieStore.set('padelsanpedro_active_club', slug, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  });
}

export async function clearActiveClub() {
  const cookieStore = await cookies();
  cookieStore.delete('padelsanpedro_active_club');
}

export interface LiberatedTurnoAlert {
  id: string;
  clubName: string;
  clubSlug: string;
  courtName: string;
  dateStr: string;
  timeStr: string;
  endTimeStr: string;
  originalClient?: string;
}

export interface HubHighlights {
  liberatedSlotsToday: LiberatedTurnoAlert[];
  todayAvailableCount: number;
}

export async function getHubHighlights(): Promise<HubHighlights> {
  try {
    const now = new Date();
    // Argentina Time offset is UTC-3
    const argDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const startOfToday = new Date(`${argDateStr}T00:00:00-03:00`);
    const endOfToday = new Date(`${argDateStr}T23:59:59-03:00`);

    // 1. Buscar turnos liberados de abonos para hoy que aún no pasaron
    const releasedBookings = await platformPrisma.booking.findMany({
      where: {
        status: 'CANCELLED',
        fixedBookingId: { not: null },
        startTime: {
          gte: now,
          lte: endOfToday,
        },
      },
      include: {
        court: true,
        tenant: {
          include: {
            systemSetting: true,
          },
        },
        fixedBooking: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // 2. Verificar cuáles de esos turnos liberados ya fueron tomados por otro cliente
    const courtIds = Array.from(new Set(releasedBookings.map((r) => r.courtId)));
    const confirmedToday = await platformPrisma.booking.findMany({
      where: {
        courtId: { in: courtIds },
        startTime: {
          gte: now,
          lte: endOfToday,
        },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      select: {
        courtId: true,
        startTime: true,
      },
    });

    const trulyAvailableLiberated: LiberatedTurnoAlert[] = [];
    for (const rb of releasedBookings) {
      const isTaken = confirmedToday.some(
        (cb) =>
          cb.courtId === rb.courtId &&
          Math.abs(new Date(cb.startTime).getTime() - new Date(rb.startTime).getTime()) < 60000
      );
      if (!isTaken) {
        const timeFmt = new Intl.DateTimeFormat('es-AR', {
          timeZone: 'America/Argentina/Buenos_Aires',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const timeStr = timeFmt.format(rb.startTime);
        const endTimeStr = timeFmt.format(rb.endTime);

        trulyAvailableLiberated.push({
          id: rb.id,
          clubName: rb.tenant?.systemSetting?.clubName || rb.tenant?.name || 'Club',
          clubSlug: rb.tenant?.slug || '',
          courtName: rb.court?.name || 'Cancha',
          dateStr: argDateStr,
          timeStr,
          endTimeStr,
          originalClient: rb.fixedBooking?.user?.name || undefined,
        });
      }
    }

    // 3. Estimar o contar turnos disponibles hoy para dar un indicador vivo al usuario
    const totalActiveCourts = await platformPrisma.court.count({
      where: { isActive: true },
    });
    const totalBookedToday = await platformPrisma.booking.count({
      where: {
        startTime: { gte: startOfToday, lte: endOfToday },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });
    const estimatedAvailable = Math.max(0, (totalActiveCourts * 7) - totalBookedToday);

    return {
      liberatedSlotsToday: trulyAvailableLiberated,
      todayAvailableCount: estimatedAvailable,
    };
  } catch (error) {
    console.error('Error in getHubHighlights:', error);
    return {
      liberatedSlotsToday: [],
      todayAvailableCount: 0,
    };
  }
}

