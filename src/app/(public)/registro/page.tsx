'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/actions/user-auth';
import { User, Phone, Mail, IdCard, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RegistroPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const result = await registerUser(formData);

        if (result.success) {
            router.push('/');
        } else {
            setError(result.error || 'Error al registrar.');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-7 sm:p-8">
                <div className="text-center mb-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-white font-black text-xl tracking-tight mb-4 hover:opacity-90 transition-opacity">
                        <span>🎾</span>
                        <span>PADEL<span className="text-emerald-400">SANPEDRO</span></span>
                    </Link>
                    <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-sm">
                        <User className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-black text-white">Unite a la Comunidad</h1>
                    <p className="text-sm font-medium text-slate-400 mt-1">Creá tu cuenta de jugador para turnos y partidos</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-rose-950/50 border border-rose-800/60 text-rose-300 p-3 rounded-2xl text-xs font-bold text-center">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-300">Nombre</label>
                            <input type="text" name="name" required className="w-full p-3 bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-300">Apellido</label>
                            <input type="text" name="lastName" required className="w-full p-3 bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                            <IdCard className="w-4 h-4 text-emerald-400" /> DNI
                        </label>
                        <input type="text" name="dni" required placeholder="Sin puntos ni espacios" className="w-full p-3 bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-emerald-400" /> Teléfono
                        </label>
                        <input type="tel" name="phone" required placeholder="Ej: 3329..." className="w-full p-3 bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-emerald-400" /> Email <span className="text-slate-500 font-normal">(Opcional)</span>
                        </label>
                        <input type="email" name="email" className="w-full p-3 bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-emerald-400" /> Contraseña
                        </label>
                        <input type="password" name="password" required placeholder="Creá una contraseña" className="w-full p-3 bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center mt-3 text-sm disabled:opacity-50"
                    >
                        {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Registrando...</> : 'Registrarme'}
                    </button>

                    <div className="text-center pt-2 space-y-2">
                        <p className="text-sm text-slate-400">
                            ¿Ya tenés cuenta?{' '}
                            <Link href="/login-usuario" className="text-emerald-400 font-bold hover:underline">
                                Iniciar Sesión
                            </Link>
                        </p>
                        <p className="text-xs text-slate-500">
                            <Link href="/" className="font-semibold hover:text-white transition-colors">
                                ← Volver a Canchas
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
