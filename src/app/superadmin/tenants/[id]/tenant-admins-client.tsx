'use client';

import { useState } from 'react';
import { 
  Users, UserPlus, KeyRound, ShieldCheck, ShieldAlert, 
  CheckCircle2, XCircle, Trash2, Eye, EyeOff, Loader2, X, Lock, LogIn
} from 'lucide-react';
import { 
  createTenantAdminUser, 
  resetTenantAdminPassword, 
  toggleTenantAdminStatus, 
  deleteTenantAdminUser,
  impersonateTenantAdmin
} from '@/actions/superadmin';

export interface TenantAdminUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  dni: string | null;
  isActive: boolean;
  createdAt: Date | string;
}

interface TenantAdminsClientProps {
  tenantId: string;
  tenantName: string;
  admins: TenantAdminUser[];
}

export function TenantAdminsClient({ tenantId, tenantName, admins }: TenantAdminsClientProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const [resettingUser, setResettingUser] = useState<TenantAdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set('tenantId', tenantId);
      await createTenantAdminUser(formData);
      setMessage({ type: 'success', text: 'Administrador creado con éxito.' });
      setOpenCreate(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error al crear el administrador.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resettingUser) return;
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set('tenantId', tenantId);
      formData.set('userId', resettingUser.id);
      await resetTenantAdminPassword(formData);
      setMessage({ type: 'success', text: `Contraseña actualizada para ${resettingUser.name || resettingUser.email}.` });
      setResettingUser(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error al restablecer la contraseña.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(admin: TenantAdminUser) {
    if (!confirm(`¿Estás seguro de ${admin.isActive ? 'desactivar' : 'activar'} a ${admin.name || admin.email}?`)) return;
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set('tenantId', tenantId);
      formData.set('userId', admin.id);
      formData.set('isActive', admin.isActive ? 'false' : 'true');
      await toggleTenantAdminStatus(formData);
      setMessage({ type: 'success', text: `Estado actualizado con éxito.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error al cambiar estado.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(admin: TenantAdminUser) {
    if (!confirm(`¿Eliminar definitivamente el usuario administrador ${admin.name || admin.email}? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set('tenantId', tenantId);
      formData.set('userId', admin.id);
      await deleteTenantAdminUser(formData);
      setMessage({ type: 'success', text: `Administrador eliminado.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error al eliminar el administrador.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            Usuarios Administradores del Club
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestiona quiénes pueden acceder al panel interno <span className="font-mono text-amber-300">/admin</span> de {tenantName}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setOpenCreate(true); setMessage(null); }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 transition-all shrink-0 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Crear Administrador
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' 
            : 'bg-red-500/10 border border-red-500/20 text-red-300'
        }`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {admins.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
          <h3 className="text-sm font-bold text-white mb-1">Sin administradores asignados</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Este club no tiene administradores todavía. Crea el primero para permitir el inicio de sesión en el panel del club.
          </p>
          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Crear el primer Admin
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-4">Administrador</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Alta</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-xs">
                        {(admin.name?.[0] || admin.email?.[0] || 'A').toUpperCase()}
                      </div>
                      <div>
                        <div>{admin.name || 'Sin nombre'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {admin.phone ? (
                      <span className="font-mono">{admin.phone}</span>
                    ) : (
                      <span className="text-slate-500 italic">Sin teléfono</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {admin.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        <XCircle className="w-3 h-3" />
                        Desactivado
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(admin.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <form action={impersonateTenantAdmin} className="inline-block">
                      <input type="hidden" name="tenantId" value={tenantId} />
                      <input type="hidden" name="userId" value={admin.id} />
                      <button
                        type="submit"
                        disabled={!admin.isActive}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-medium text-[11px] transition-colors inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed align-middle"
                        title="Ingresar al panel de control de este club como este administrador"
                      >
                        <LogIn className="w-3 h-3" />
                        Acceder
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => { setResettingUser(admin); setMessage(null); }}
                      className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-amber-300 border border-slate-700 font-medium text-[11px] transition-colors align-middle"
                      title="Cambiar Contraseña"
                    >
                      Cambiar Clave
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(admin)}
                      disabled={loading}
                      className={`px-2 py-1 rounded-lg border font-medium text-[11px] transition-colors align-middle ${
                        admin.isActive 
                          ? 'bg-slate-850 hover:bg-slate-800 text-slate-400 border-slate-700' 
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                      }`}
                      title={admin.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                    >
                      {admin.isActive ? 'Pausar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(admin)}
                      disabled={loading}
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors inline-flex items-center justify-center align-middle"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal / Dialog: Crear Administrador */}
      {openCreate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  Nuevo Administrador para {tenantName}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Podrá acceder al panel del club con estas credenciales.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setOpenCreate(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nombre Completo *</label>
                <input
                  name="name"
                  required
                  placeholder="Ej: Marcelo Gómez"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email / Usuario de Acceso *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="admin.club@padelsanpedro.ar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Teléfono (WhatsApp)</label>
                <input
                  name="phone"
                  placeholder="3329-123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Contraseña Inicial *</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOpenCreate(false)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar Administrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Dialog: Cambiar Contraseña */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Cambiar Contraseña
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Para {resettingUser.name || resettingUser.email}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setResettingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nueva Contraseña *</label>
                <div className="relative">
                  <input
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Se cerrarán automáticamente las sesiones activas anteriores.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
