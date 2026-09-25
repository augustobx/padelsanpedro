import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const connectionString = (process.env.DATABASE_URL || '').replace('mysql://', 'mariadb://');
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(connectionString) });

const sampleClubs = [
  {
    slug: 'san-pedro-padel',
    name: 'San Pedro Padel',
    setting: {
      clubName: 'San Pedro Padel',
      contactPhone: '3329-551122',
      courtPhone: '3329-551122',
      topbarName: 'San Pedro Padel',
      primaryColor: '#10b981',
      secondaryColor: '#059669',
      reservationFee: 16000,
    },
    courts: [
      { name: 'Cancha 1 (Techada)', surface: 'Césped Sintético Techada (Indoor)' },
      { name: 'Cancha 2 (Techada)', surface: 'Césped Sintético Techada (Indoor)' },
      { name: 'Cancha 3 (Panorámica)', surface: 'Césped Sintético - Vidrio Panorámico' },
    ],
    hours: { openTime: '08:00', closeTime: '23:30', slotDuration: 90 },
  },
  {
    slug: 'mitre-padel',
    name: 'Club Mitre Padel',
    setting: {
      clubName: 'Club Mitre Padel',
      contactPhone: '3329-663344',
      courtPhone: '3329-663344',
      topbarName: 'Mitre Padel',
      primaryColor: '#3b82f6',
      secondaryColor: '#2563eb',
      reservationFee: 14000,
    },
    courts: [
      { name: 'Cancha Central', surface: 'Blindex y Césped Sintético' },
      { name: 'Cancha 2', surface: 'Piso Sintético Outdoor' },
    ],
    hours: { openTime: '09:00', closeTime: '23:00', slotDuration: 90 },
  },
  {
    slug: 'la-estacion',
    name: 'La Estación Padel Club',
    setting: {
      clubName: 'La Estación Padel',
      contactPhone: '3329-778899',
      courtPhone: '3329-778899',
      topbarName: 'La Estación',
      primaryColor: '#8b5cf6',
      secondaryColor: '#7c3aed',
      reservationFee: 18000,
    },
    courts: [
      { name: 'Cancha Pro 1', surface: 'Césped Premium Techada (Indoor)' },
      { name: 'Cancha Pro 2', surface: 'Césped Premium Techada (Indoor)' },
    ],
    hours: { openTime: '08:00', closeTime: '00:00', slotDuration: 90 },
  },
];

async function seed() {
  console.log('Seeding initial clubs for PadelSanPedro...');
  try {
    for (const club of sampleClubs) {
      const tenant = await prisma.tenant.upsert({
        where: { slug: club.slug },
        create: {
          slug: club.slug,
          name: club.name,
          status: 'ACTIVE',
        },
        update: {
          name: club.name,
          status: 'ACTIVE',
        },
      });

      console.log(`Tenant ${tenant.name} (${tenant.slug}) ready: ${tenant.id}`);

      const enterprisePlan = await prisma.plan.findUnique({ where: { code: 'ENTERPRISE' } });
      if (enterprisePlan) {
        await prisma.tenantSubscription.upsert({
          where: { id: `sub-${tenant.slug}` },
          create: {
            id: `sub-${tenant.slug}`,
            tenantId: tenant.id,
            planId: enterprisePlan.id,
            status: 'ACTIVE',
            startsAt: new Date(),
          },
          update: {
            status: 'ACTIVE',
            planId: enterprisePlan.id,
          },
        });
      }

      await prisma.systemSetting.upsert({
        where: { tenantId: tenant.id },
        create: {
          tenantId: tenant.id,
          clubName: club.setting.clubName,
          contactPhone: club.setting.contactPhone,
          courtPhone: club.setting.courtPhone,
          topbarName: club.setting.topbarName,
          primaryColor: club.setting.primaryColor,
          secondaryColor: club.setting.secondaryColor,
          reservationFee: club.setting.reservationFee,
          reservationsEnabled: true,
          communityEnabled: true,
        },
        update: {
          clubName: club.setting.clubName,
          contactPhone: club.setting.contactPhone,
          courtPhone: club.setting.courtPhone,
          topbarName: club.setting.topbarName,
          primaryColor: club.setting.primaryColor,
          secondaryColor: club.setting.secondaryColor,
          reservationFee: club.setting.reservationFee,
        },
      });

      for (const courtData of club.courts) {
        const existingCourt = await prisma.court.findFirst({
          where: { tenantId: tenant.id, name: courtData.name },
        });

        const court = existingCourt
          ? await prisma.court.update({
              where: { id: existingCourt.id },
              data: { surface: courtData.surface, isActive: true },
            })
          : await prisma.court.create({
              data: {
                tenantId: tenant.id,
                name: courtData.name,
                surface: courtData.surface,
                sport: 'Padel',
                isActive: true,
              },
            });

        for (let day = 0; day <= 6; day++) {
          await prisma.businessHour.upsert({
            where: {
              tenantId_courtId_dayOfWeek: {
                tenantId: tenant.id,
                courtId: court.id,
                dayOfWeek: day,
              },
            },
            create: {
              tenantId: tenant.id,
              courtId: court.id,
              dayOfWeek: day,
              openTime: club.hours.openTime,
              closeTime: club.hours.closeTime,
              slotDuration: club.hours.slotDuration,
            },
            update: {
              openTime: club.hours.openTime,
              closeTime: club.hours.closeTime,
              slotDuration: club.hours.slotDuration,
            },
          });
        }
      }
    }
    console.log('Seeding completed successfully!');
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
