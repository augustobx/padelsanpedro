import Link from 'next/link';
import { ArrowLeft, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';
import { requirePlatformAdmin } from '@/lib/platform-auth';
import { getHubConfig } from '@/actions/hub-settings';
import HubSettingsForm from './HubSettingsForm';

export default async function SuperAdminAppHubPage() {
  await requirePlatformAdmin();
  const hubConfig = await getHubConfig();

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/superadmin"
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> SuperAdmin
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-bold text-emerald-400">App Hub & Splash</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-amber-400" />
            Configuración de la App Hub
          </h1>
          <p className="text-sm text-slate-400">
            Personalizá la pantalla de bienvenida (Splash Screen), identidad visual y avisos globales para la app de San Pedro.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <a
            href="https://sppadel.nanoapps.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            Abrir Hub en Vivo
          </a>
        </div>
      </div>

      {/* Main Form + Real-time Simulator */}
      <HubSettingsForm initialConfig={hubConfig} />
    </div>
  );
}
