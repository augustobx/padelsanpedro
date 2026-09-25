'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { addWeeks } from 'date-fns';
import { requireAdmin } from '@/lib/admin-auth';

export async function getFixedBookings() {
    try {
        await requireAdmin();
        const fixedBookings = await prisma.fixedBooking.findMany({
            include: {
                user: true,
                court: true,
                _count: {
                    select: { bookings: { where: { status: { not: 'CANCELLED' } } } }
                }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });
        return { success: true, data: fixedBookings };
    } catch (error: any) {
        return { success: false, error: 'Error al obtener los abonos fijos.' };
    }
}

export async function deleteFixedBooking(id: string) {
    try {
        await requireAdmin();
        await prisma.$transaction(async (tx) => {
            // Delete or mark inactive the fixed booking
            await tx.fixedBooking.update({
                where: { id },
                data: { isActive: false }
            });

            // Cancel all future bookings related to this fixed booking
            const now = new Date();
            await tx.booking.updateMany({
                where: {
                    fixedBookingId: id,
                    startTime: { gte: now }
                },
                data: {
                    status: 'CANCELLED',
                    slotKey: null,
                }
            });
        });

        revalidatePath('/admin/abonos');
        revalidatePath('/admin/calendar');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Error al eliminar el abono.' };
    }
}

export async function updateFixedBooking(id: string, data: {
    courtId: string;
    dayOfWeek: number;
    startTimeStr: string;
    endTimeStr: string;
    clientName: string;
    clientPhone: string;
}) {
    try {
        await requireAdmin();
        await prisma.$transaction(async (tx) => {
            const fb = await tx.fixedBooking.findUnique({ where: { id }, include: { user: true } });
            if (!fb) throw new Error("Abono no encontrado");

            // Update user details
            await tx.user.update({
                where: { id: fb.userId },
                data: {
                    name: data.clientName,
                    phone: data.clientPhone
                }
            });

            const now = new Date();
            const todayDay = now.getDay();
            let diffDays = data.dayOfWeek - todayDay;
            if (diffDays < 0) diffDays += 7;
            
            const baseStartDateObj = new Date();
            baseStartDateObj.setDate(baseStartDateObj.getDate() + diffDays);
            const dateStr = `${baseStartDateObj.getFullYear()}-${String(baseStartDateObj.getMonth() + 1).padStart(2, '0')}-${String(baseStartDateObj.getDate()).padStart(2, '0')}`;
            
            const baseStartTime = new Date(`${dateStr}T${data.startTimeStr}:00-03:00`);
            const baseEndTime = new Date(`${dateStr}T${data.endTimeStr}:00-03:00`);
            if (baseEndTime <= baseStartTime) {
                baseEndTime.setDate(baseEndTime.getDate() + 1);
            }

            // Update FixedBooking
            await tx.fixedBooking.update({
                where: { id },
                data: {
                    courtId: data.courtId,
                    dayOfWeek: data.dayOfWeek,
                    startTime: data.startTimeStr,
                    endTime: data.endTimeStr,
                }
            });

            // Cancel existing future bookings
            await tx.booking.updateMany({
                where: {
                    fixedBookingId: id,
                    startTime: { gte: now }
                },
                data: { status: 'CANCELLED', slotKey: null }
            });

            // Re-generate future bookings until original endDate
            for (let i = 0; i < 24; i++) {
                const startTime = addWeeks(baseStartTime, i);
                const endTime = addWeeks(baseEndTime, i);

                if (startTime > fb.endDate) break;

                const existing = await tx.booking.findFirst({
                    where: {
                        courtId: data.courtId,
                        status: { in: ['PENDING', 'CONFIRMED', 'FIXED', 'BLOCKED'] },
                        startTime: { lt: endTime },
                        endTime: { gt: startTime },
                    }
                });

                if (!existing) {
                    await tx.booking.create({
                        data: {
                            tenantId: fb.tenantId,
                            courtId: data.courtId,
                            userId: fb.userId,
                            startTime,
                            endTime,
                            status: 'FIXED',
                            totalAmount: 0,
                            fixedBookingId: id,
                            slotKey: `${data.courtId}:${startTime.toISOString()}`,
                        }
                    });
                }
            }
        });

        revalidatePath('/admin/abonos');
        revalidatePath('/admin/calendar');
        return { success: true };
    } catch (error: any) {
        console.error(error);
        return { success: false, error: error.message || 'Error al actualizar el abono.' };
    }
}

export async function releaseFixedBookingForDate(data: {
    fixedBookingId: string;
    courtId: string;
    dateStr: string;
    startTimeStr: string;
    endTimeStr?: string;
}) {
    try {
        await requireAdmin();
        const startDateTime = new Date(`${data.dateStr}T${data.startTimeStr}:00-03:00`);
        let endDateTime = data.endTimeStr
            ? new Date(`${data.dateStr}T${data.endTimeStr}:00-03:00`)
            : new Date(startDateTime.getTime() + 90 * 60 * 1000);
        if (endDateTime <= startDateTime) {
            endDateTime.setDate(endDateTime.getDate() + 1);
        }

        const fb = await prisma.fixedBooking.findUnique({
            where: { id: data.fixedBookingId },
            include: { user: true, court: true }
        });
        if (!fb) {
            return { success: false, error: 'Abono fijo no encontrado.' };
        }

        // Buscar si ya existe una reserva registrada para ese día puntual
        const existingBooking = await prisma.booking.findFirst({
            where: {
                courtId: data.courtId,
                startTime: startDateTime,
                fixedBookingId: fb.id,
            }
        });

        if (existingBooking) {
            await prisma.booking.update({
                where: { id: existingBooking.id },
                data: {
                    status: 'CANCELLED',
                    slotKey: null,
                    description: `[TURNO LIBERADO] Abono de ${fb.user?.name || 'Cliente'}`
                }
            });
        } else {
            // Si no existía aún en la tabla Booking, lo creamos directamente como CANCELLED
            await prisma.booking.create({
                data: {
                    tenantId: fb.tenantId,
                    courtId: data.courtId,
                    userId: fb.userId,
                    startTime: startDateTime,
                    endTime: endDateTime,
                    status: 'CANCELLED',
                    slotKey: null,
                    fixedBookingId: fb.id,
                    totalAmount: 0,
                    description: `[TURNO LIBERADO] Abono de ${fb.user?.name || 'Cliente'}`
                }
            });
        }

        revalidatePath('/admin/calendar');
        revalidatePath('/admin/abonos');
        revalidatePath('/');
        return { success: true, message: 'Turno liberado con éxito para esta fecha.' };
    } catch (error: any) {
        console.error('Error in releaseFixedBookingForDate:', error);
        return { success: false, error: error.message || 'Error al liberar el turno fijo.' };
    }
}

export async function restoreFixedBookingForDate(data: {
    fixedBookingId: string;
    courtId: string;
    dateStr: string;
    startTimeStr: string;
    endTimeStr?: string;
}) {
    try {
        await requireAdmin();
        const startDateTime = new Date(`${data.dateStr}T${data.startTimeStr}:00-03:00`);
        let endDateTime = data.endTimeStr
            ? new Date(`${data.dateStr}T${data.endTimeStr}:00-03:00`)
            : new Date(startDateTime.getTime() + 90 * 60 * 1000);
        if (endDateTime <= startDateTime) {
            endDateTime.setDate(endDateTime.getDate() + 1);
        }

        // Verificar si alguien ya reservó este turno mientras estuvo liberado
        const conflictingBooking = await prisma.booking.findFirst({
            where: {
                courtId: data.courtId,
                startTime: { lt: endDateTime },
                endTime: { gt: startDateTime },
                status: { in: ['PENDING', 'CONFIRMED', 'BLOCKED'] }
            }
        });
        if (conflictingBooking) {
            return { 
                success: false, 
                error: 'No se puede restablecer: el turno ya fue reservado por otro cliente para este día.' 
            };
        }

        const fb = await prisma.fixedBooking.findUnique({
            where: { id: data.fixedBookingId },
            include: { user: true }
        });
        if (!fb) return { success: false, error: 'Abono fijo no encontrado.' };

        const releasedBooking = await prisma.booking.findFirst({
            where: {
                courtId: data.courtId,
                startTime: startDateTime,
                fixedBookingId: fb.id,
                status: 'CANCELLED'
            }
        });

        if (releasedBooking) {
            await prisma.booking.update({
                where: { id: releasedBooking.id },
                data: {
                    status: 'FIXED',
                    slotKey: `${data.courtId}:${startDateTime.toISOString()}`,
                    description: `Abono fijo semanal`
                }
            });
        }

        revalidatePath('/admin/calendar');
        revalidatePath('/admin/abonos');
        revalidatePath('/');
        return { success: true, message: 'Turno fijo restablecido para esta fecha.' };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al restablecer turno fijo.' };
    }
}

export async function getUpcomingDatesForFixedBooking(fixedBookingId: string) {
    try {
        await requireAdmin();
        const fb = await prisma.fixedBooking.findUnique({
            where: { id: fixedBookingId },
            include: { court: true, user: true }
        });
        if (!fb) return { success: false, error: 'Abono no encontrado.' };

        const now = new Date();
        const base = new Date();
        base.setHours(12, 0, 0, 0);

        let current = new Date(base);
        while (current.getDay() !== fb.dayOfWeek) {
            current.setDate(current.getDate() + 1);
        }

        const dateList: string[] = [];
        for (let i = 0; i < 8; i++) {
            const d = new Date(current);
            d.setDate(current.getDate() + (i * 7));
            dateList.push(d.toISOString().split('T')[0]);
        }

        const bookings = await prisma.booking.findMany({
            where: {
                courtId: fb.courtId,
                startTime: {
                    gte: new Date(`${dateList[0]}T00:00:00-03:00`),
                    lte: new Date(`${dateList[dateList.length - 1]}T23:59:59-03:00`),
                }
            },
            include: { user: true }
        });

        const result = dateList.map(dateStr => {
            const startD = new Date(`${dateStr}T${fb.startTime}:00-03:00`);
            const slotBookings = bookings.filter(b => 
                Math.abs(new Date(b.startTime).getTime() - startD.getTime()) < 60000
            );

            const releasedBooking = slotBookings.find(b => b.fixedBookingId === fb.id && b.status === 'CANCELLED');
            const rebooked = slotBookings.find(b => b.status === 'CONFIRMED' || b.status === 'PENDING');

            return {
                dateStr,
                timeStr: fb.startTime,
                endTimeStr: fb.endTime,
                courtName: fb.court?.name,
                isReleased: Boolean(releasedBooking && !rebooked),
                isRebooked: Boolean(rebooked),
                rebookedBy: rebooked?.user?.name || null,
            };
        });

        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: 'Error al obtener fechas del abono.' };
    }
}

