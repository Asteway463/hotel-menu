import { NextResponse, type NextRequest } from 'next/server';

/**
 * Admin area guard + security headers.
 * - Unauthenticated requests to /admin are redirected to the public /login page.
 * - Security headers applied to all responses (local offline-first deployment
 *   uses plain HTTP on the LAN; headers mitigate common web attacks).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/');
  const isLoginPage = pathname === '/login';

  if (!isAdminArea || isLoginPage) {
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    return response;
  }

  const token = request.cookies.get('admin_session')?.value;
  const hasSession =
    Boolean(token) && token!.length > 0 && Boolean(process.env.ADMIN_SESSION_SECRET);

  if (hasSession) {
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    return response;
  }

  const url = new URL('/login', request.url);
  url.searchParams.set('from', pathname);
  const redirect = NextResponse.redirect(url);
  redirect.headers.set('X-Content-Type-Options', 'nosniff');
  return redirect;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/:path*'],
};
