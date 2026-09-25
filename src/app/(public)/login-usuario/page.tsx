'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/actions/user-auth';
import { IdCard, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginUsuarioPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const result = await loginUser(formData);

        if (result.success) {
            router.push('/');
        } else {
            setError(result.error || 'Credenciales inválidas.');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-7 sm:p-8">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-white font-black text-xl tracking-tight mb-4 hover:opacity-90 transition-opacity">
                        <span>🎾</span>
                        <span>PADEL<span className="text-emerald-400">SANPEDRO</span></span>
                    </Link>
                    <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-sm">
                        <Lock className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-black text-white">Iniciar Sesión</h1>
                    <p className="text-sm font-medium text-slate-400 mt-1">Ingresá a tu cuenta de jugador</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-rose-950/50 border border-rose-800/60 text-rose-300 p-3 rounded-2xl text-xs font-bold text-center">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                            <IdCard className="w-4 h-4 text-emerald-400" /> DNI
                        </label>
                        <input
                            type="text"
                            name="dni"
                            required
                            placeholder="Tu número de documento"
                            className="w-full p-3.5 bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 rounded-2xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-emerald-400" /> Contraseña
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            placeholder="••••••••"
                            className="w-full p-3.5 bg-slate-800/90 border border-slate-700 text-white placeholder:text-slate-500 rounded-2xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center text-sm disabled:opacity-50"
                    >
                        {loading ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Ingresando...</>
                        ) : (
                            'Entrar a mi cuenta'
                        )}
                    </button>

                    <div className="text-center pt-2 space-y-2">
                        <p className="text-sm text-slate-400">
                            ¿No tenés cuenta?{' '}
                            <Link href="/registro" className="text-emerald-400 font-bold hover:underline">
                                Registrate acá
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
