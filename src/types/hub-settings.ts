export interface HubConfig {
  splashEnabled: boolean;
  splashTitle: string;
  splashTagline: string;
  splashBadge: string;
  splashLogoUrl: string;
  splashStyle: 'neon-glow' | 'minimal-modern' | 'cinematic';
  splashDuration: number; // in ms, 800 - 5000
  splashShowOnce: boolean;
  heroNoticeText: string;
  heroNoticeActive: boolean;
  accentColor: string;
}

export const DEFAULT_HUB_CONFIG: HubConfig = {
  splashEnabled: true,
  splashTitle: 'PADEL SAN PEDRO',
  splashTagline: 'La red oficial de canchas y partidos de San Pedro',
  splashBadge: 'APP HUB OFICIAL',
  splashLogoUrl: '🎾',
  splashStyle: 'neon-glow',
  splashDuration: 2000,
  splashShowOnce: true,
  heroNoticeText: '¡Bienvenidos a la red oficial de complejos de Padel San Pedro!',
  heroNoticeActive: true,
  accentColor: '#10b981',
};
