'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { platformPrisma } from '@/lib/prisma-core';
import { requirePlatformAdmin } from '@/lib/platform-auth';
import { DEFAULT_HUB_CONFIG, type HubConfig } from '@/types/hub-settings';

export async function getHubConfig(): Promise<HubConfig> {
  try {
    const rows = await (platformPrisma as any).hubSetting.findMany();
    if (!rows || rows.length === 0) {
      return DEFAULT_HUB_CONFIG;
    }

    const map = new Map<string, string>();
    for (const r of rows) {
      map.set(r.settingKey, r.value);
    }

    return {
      splashEnabled: map.has('splashEnabled') ? map.get('splashEnabled') === 'true' : DEFAULT_HUB_CONFIG.splashEnabled,
      splashTitle: map.get('splashTitle') || DEFAULT_HUB_CONFIG.splashTitle,
      splashTagline: map.get('splashTagline') || DEFAULT_HUB_CONFIG.splashTagline,
      splashBadge: map.get('splashBadge') || DEFAULT_HUB_CONFIG.splashBadge,
      splashLogoUrl: map.get('splashLogoUrl') || DEFAULT_HUB_CONFIG.splashLogoUrl,
      splashStyle: (map.get('splashStyle') as HubConfig['splashStyle']) || DEFAULT_HUB_CONFIG.splashStyle,
      splashDuration: map.has('splashDuration') ? Number(map.get('splashDuration')) || DEFAULT_HUB_CONFIG.splashDuration : DEFAULT_HUB_CONFIG.splashDuration,
      splashShowOnce: map.has('splashShowOnce') ? map.get('splashShowOnce') === 'true' : DEFAULT_HUB_CONFIG.splashShowOnce,
      heroNoticeText: map.get('heroNoticeText') || DEFAULT_HUB_CONFIG.heroNoticeText,
      heroNoticeActive: map.has('heroNoticeActive') ? map.get('heroNoticeActive') === 'true' : DEFAULT_HUB_CONFIG.heroNoticeActive,
      accentColor: map.get('accentColor') || DEFAULT_HUB_CONFIG.accentColor,
    };
  } catch (error) {
    console.warn('Could not read hubSetting from platformPrisma, using default config:', error);
    return DEFAULT_HUB_CONFIG;
  }
}

export async function saveHubConfig(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requirePlatformAdmin();

    const splashEnabled = formData.get('splashEnabled') === 'on' || formData.get('splashEnabled') === 'true';
    const splashTitle = z.string().trim().min(2).max(80).parse(formData.get('splashTitle') || DEFAULT_HUB_CONFIG.splashTitle);
    const splashTagline = z.string().trim().max(160).parse(formData.get('splashTagline') || '');
    const splashBadge = z.string().trim().max(50).parse(formData.get('splashBadge') || '');
    const splashLogoUrl = z.string().trim().max(500).parse(formData.get('splashLogoUrl') || 'padel-racket');
    const splashStyle = z.enum(['neon-glow', 'minimal-modern', 'cinematic']).parse(formData.get('splashStyle') || 'neon-glow');
    const splashDuration = Math.min(5000, Math.max(800, Number(formData.get('splashDuration') || 2000)));
    const splashShowOnce = formData.get('splashShowOnce') === 'on' || formData.get('splashShowOnce') === 'true';
    const heroNoticeText = z.string().trim().max(255).parse(formData.get('heroNoticeText') || '');
    const heroNoticeActive = formData.get('heroNoticeActive') === 'on' || formData.get('heroNoticeActive') === 'true';
    const accentColor = z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).parse(formData.get('accentColor') || '#10b981');

    const entries: [string, string][] = [
      ['splashEnabled', String(splashEnabled)],
      ['splashTitle', splashTitle],
      ['splashTagline', splashTagline],
      ['splashBadge', splashBadge],
      ['splashLogoUrl', splashLogoUrl],
      ['splashStyle', splashStyle],
      ['splashDuration', String(splashDuration)],
      ['splashShowOnce', String(splashShowOnce)],
      ['heroNoticeText', heroNoticeText],
      ['heroNoticeActive', String(heroNoticeActive)],
      ['accentColor', accentColor],
    ];

    await platformPrisma.$transaction(async (tx: any) => {
      for (const [settingKey, value] of entries) {
        await tx.hubSetting.upsert({
          where: { settingKey },
          create: { settingKey, value },
          update: { value },
        });
      }

      await tx.platformAuditLog.create({
        data: {
          actorId: actor.userId,
          action: 'HUB_SETTINGS_UPDATED',
          entityType: 'HubSetting',
          entityId: 'hub',
          metadata: { splashEnabled, splashTitle, splashStyle, splashDuration },
        },
      });
    });

    revalidatePath('/');
    revalidatePath('/superadmin/app-hub');

    return { success: true };
  } catch (error: any) {
    console.error('Error saving hub config:', error);
    return { success: false, error: error?.message || 'Error al guardar la configuración del Hub' };
  }
}
