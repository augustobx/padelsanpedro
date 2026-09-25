import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  // Manejo de club activo para PadelSanPedro
  if (request.nextUrl.pathname.startsWith('/club/')) {
    const parts = request.nextUrl.pathname.split('/');
    const slug = parts[2];
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
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get('onlypadel_admin_session');
    
    // Si no tiene la cookie de sesión iniciada, lo mandamos al login
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/club/:path*'],
};
