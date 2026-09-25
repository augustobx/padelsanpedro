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
