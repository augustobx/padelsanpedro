import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
 appId: 'ar.nanoapps.padelsanpedro',
 appName: 'Padel San Pedro',
 webDir: 'public',
 server: {
 url: 'https://sppadel.nanoapps.ar',
 cleartext: false,
 androidScheme: 'https',
 },
 android: {
 backgroundColor: '#020617',
 allowMixedContent: false,
 },
};

export default config;
