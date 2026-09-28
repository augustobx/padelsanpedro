'use server';

import { platformPrisma } from '@/lib/prisma-core';
import { cookies } from 'next/headers';

export interface LiberatedSlotInfo {
  id: string;
  courtName: string;
  courtId: string;
  timeStr: string;
  endTimeStr: string;
}

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
  todayAvailableCount: number;
  upcomingSlots: string[];
  liberatedSlots: LiberatedSlotInfo[];
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

    const now = new Date();
    // Argentina Time (UTC-3)
    const argDateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);

    const year = Number(argDateParts.find((p) => p.type === 'year')?.value);
    const month = Number(argDateParts.find((p) => p.type === 'month')?.value);
    const day = Number(argDateParts.find((p) => p.type === 'day')?.value);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

    const startOfDay = new Date(`${dateStr}T00:00:00-03:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999-03:00`);

    const allCourtIds = tenants.flatMap((t) => (t.courts || []).map((c) => c.id));

    const [businessHours, existingBookings, releasedBookings, fixedBookings, courtBlocks] = await Promise.all([
      platformPrisma.businessHour.findMany({
        where: { courtId: { in: allCourtIds }, dayOfWeek },
      }),
      platformPrisma.booking.findMany({
        where: {
          courtId: { in: allCourtIds },
          startTime: { gte: startOfDay, lte: endOfDay },
          status: { in: ['CONFIRMED', 'PENDING', 'FIXED', 'BLOCKED'] },
        },
        select: { courtId: true, startTime: true, endTime: true },
      }),
      platformPrisma.booking.findMany({
        where: {
          courtId: { in: allCourtIds },
          startTime: { gte: now, lte: endOfDay },
          status: 'CANCELLED',
          fixedBookingId: { not: null },
        },
        select: { id: true, courtId: true, startTime: true, endTime: true },
      }),
      platformPrisma.fixedBooking.findMany({
        where: {
          courtId: { in: allCourtIds },
          dayOfWeek,
          isActive: true,
          startDate: { lte: endOfDay },
          endDate: { gte: startOfDay },
        },
        select: { courtId: true, startTime: true, endTime: true },
      }),
      platformPrisma.courtBlock.findMany({
        where: {
          courtId: { in: allCourtIds },
          startTime: { lte: endOfDay },
          endTime: { gte: startOfDay },
        },
        select: { courtId: true, startTime: true, endTime: true },
      }),
    ]);

    return tenants.map((t) => {
      const courts = t.courts || [];
      const surfaces = Array.from(new Set(courts.map((c) => c.surface).filter(Boolean)));

      let todayAvailableCount = 0;
      const upcomingSlotsSet = new Set<string>();
      const liberatedSlots: LiberatedSlotInfo[] = [];

      for (const court of courts) {
        const bh = businessHours.find((b) => b.courtId === court.id);
        if (!bh || !bh.openTime || !bh.closeTime) continue;

        const [openH, openM] = bh.openTime.split(':').map(Number);
        const [closeH, closeM] = bh.closeTime.split(':').map(Number);
        const duration = bh.slotDuration || 90;

        let currentMins = openH * 60 + openM;
        let endMins = closeH * 60 + closeM;
        if (endMins <= currentMins) endMins += 24 * 60;

        while (currentMins + duration <= endMins) {
          const slotHour = Math.floor(currentMins / 60) % 24;
          const slotMin = currentMins % 60;
          const timeStr = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;

          const dayOffset = Math.floor(currentMins / (24 * 60));
          const slotDate = new Date(`${dateStr}T${timeStr}:00-03:00`);
          if (dayOffset > 0) {
            slotDate.setDate(slotDate.getDate() + dayOffset);
          }
          const slotEndDate = new Date(slotDate.getTime() + duration * 60000);

          // Skip slots that have already started or passed
          if (slotDate.getTime() <= now.getTime()) {
            currentMins += duration;
            continue;
          }

          // Check if booked
          const isBooked = existingBookings.some(
            (b) =>
              b.courtId === court.id &&
              new Date(b.startTime).getTime() < slotEndDate.getTime() &&
              new Date(b.endTime).getTime() > slotDate.getTime()
          );
          if (isBooked) {
            currentMins += duration;
            continue;
          }

          // Check if blocked
          const isBlocked = courtBlocks.some(
            (cb) =>
              cb.courtId === court.id &&
              new Date(cb.startTime).getTime() < slotEndDate.getTime() &&
              new Date(cb.endTime).getTime() > slotDate.getTime()
          );
          if (isBlocked) {
            currentMins += duration;
            continue;
          }

          // Check fixed booking
          const hasFixed = fixedBookings.some((fb) => {
            if (fb.courtId !== court.id) return false;
            const [fbH, fbM] = fb.startTime.split(':').map(Number);
            return fbH * 60 + fbM === currentMins % (24 * 60);
          });

          // Check if this fixed booking was released for today
          const isLiberated = releasedBookings.find(
            (rb) =>
              rb.courtId === court.id &&
              Math.abs(new Date(rb.startTime).getTime() - slotDate.getTime()) < 60000
          );

          if (hasFixed && !isLiberated) {
            currentMins += duration;
            continue;
          }

          // Available slot!
          todayAvailableCount++;
          upcomingSlotsSet.add(timeStr);

          if (isLiberated) {
            const endHour = Math.floor((currentMins + duration) / 60) % 24;
            const endMin = (currentMins + duration) % 60;
            liberatedSlots.push({
              id: isLiberated.id,
              courtName: court.name,
              courtId: court.id,
              timeStr,
              endTimeStr: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
            });
          }

          currentMins += duration;
        }
      }

      const upcomingSlots = Array.from(upcomingSlotsSet).sort((a, b) => a.localeCompare(b));

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
        todayAvailableCount,
        upcomingSlots,
        liberatedSlots,
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

export interface OpenMatchHighlight {
  id: string;
  clubName: string;
  courtName: string;
  dateStr: string;
  startTime: string;
  level: string | null;
  slotsNeeded: number;
  creatorName: string;
}

export interface HubHighlights {
  liberatedSlotsToday: LiberatedTurnoAlert[];
  todayAvailableCount: number;
  openMatchesCount: number;
  activeOpenMatches: OpenMatchHighlight[];
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

    // 4. Buscar convocatorias y partidos abiertos activos para el radar del Hub
    let activeOpenMatches: OpenMatchHighlight[] = [];
    let openMatchesCount = 0;
    try {
      const openMatchesData = await platformPrisma.openMatch.findMany({
        where: {
          status: 'OPEN',
          date: { gte: startOfToday },
        },
        include: {
          creator: { select: { name: true, lastName: true } },
          tenant: { select: { name: true, slug: true, systemSetting: { select: { clubName: true } } } },
        },
        orderBy: { date: 'asc' },
        take: 3,
      });

      openMatchesCount = await platformPrisma.openMatch.count({
        where: { status: 'OPEN', date: { gte: startOfToday } },
      });

      activeOpenMatches = openMatchesData.map((m) => ({
        id: m.id,
        clubName: m.tenant?.systemSetting?.clubName || m.tenant?.name || 'Complejo San Pedro',
        courtName: m.courtName,
        dateStr: new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', day: 'numeric' }).format(m.date),
        startTime: m.startTime,
        level: m.level,
        slotsNeeded: m.slotsNeeded,
        creatorName: `${m.creator.name} ${m.creator.lastName || ''}`.trim(),
      }));
    } catch (e) {
      console.warn('Could not query openMatches for hub radar:', e);
    }

    return {
      liberatedSlotsToday: trulyAvailableLiberated,
      todayAvailableCount: estimatedAvailable,
      openMatchesCount,
      activeOpenMatches,
    };
  } catch (error) {
    console.error('Error in getHubHighlights:', error);
    return {
      liberatedSlotsToday: [],
      todayAvailableCount: 0,
      openMatchesCount: 0,
      activeOpenMatches: [],
    };
  }
}


