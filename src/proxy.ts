import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const reservedPaths = new Set([
  'api', 'admin', 'superadmin', 'platform', 'login', 'login-usuario',
  'registro', 'perfil', 'ranking', 'comunidad', 'torneos', 'mis-turnos',
  'cuenta-corriente', 'reservas', 'tv', 'suspendido', 'categorias-jugadores',
  'manifest.webmanifest', 'favicon.ico', '_next', 'club', 'sw.js',
]);

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Manejo de URL directa por slug corto (ej: /san-pedro-padel -> /club/san-pedro-padel)
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1 && !reservedPaths.has(segments[0]) && !segments[0].includes('.')) {
    return NextResponse.redirect(new URL(`/club/${segments[0]}`, request.url));
  }

  // Manejo de club activo para PadelSanPedro
  if (pathname.startsWith('/club/')) {
    const slug = segments[1];
    if (slug) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-padelsanpedro-club', slug);
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      response.cookies.set('padelsanpedro_active_club', slug, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
      return response;
    }
  }

  // Interceptamos rutas de /admin
  if (pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get('onlypadel_admin_session');
    
    // Si no tiene la cookie de sesión iniciada, lo mandamos al login
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
