'use server';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { platformPrisma } from '@/lib/prisma-core';
import { clearAdminSession, createAdminSession } from '@/lib/admin-auth';
import { TenantResolutionError } from '@/lib/tenant-context';

export async function loginAdmin(formData: FormData) {
  try {
    const identity = String(formData.get('user') || '').trim().toLowerCase();
    const password = String(formData.get('pass') || '');
    if (!identity || !password) return { success: false, error: 'Credenciales inválidas' };

    const user = await platformPrisma.user.findFirst({
      where: {
        role: 'ADMIN',
        isActive: true,
        OR: [{ email: identity }, { dni: identity }, { name: identity }],
      },
      include: { tenant: true },
    });

    if (!user || !user.tenantId || !user.password || !(await bcrypt.compare(password, user.password))) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    if (user.tenant?.status === 'SUSPENDED') {
      return { success: false, suspended: true, error: 'La membresía del club se encuentra suspendida.' };
    }
    if (!user.tenant || user.tenant.status === 'ARCHIVED') {
      return { success: false, error: 'El club no se encuentra activo.' };
    }

    const cookieStore = await cookies();
    cookieStore.set('padelsanpedro_active_club', user.tenant.slug, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    await createAdminSession(user.id, user.tenantId);
    return { success: true };
  } catch (error) {
    if (error instanceof TenantResolutionError && error.message === 'TENANT_SUSPENDED') {
      return { success: false, suspended: true, error: 'La membresía del club se encuentra suspendida.' };
    }
    console.error('Admin login failed', error instanceof Error ? error.message : 'unknown');
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function logoutAdmin() {
  await clearAdminSession();
}
