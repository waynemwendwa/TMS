import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('tms_token')?.value || req.headers.get('authorization') || '';
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup');
  const isPublic = isAuthPage || pathname === '/' || pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname.startsWith('/favicon');

  // Treat presence of localStorage token on client; here only cookies/headers are visible at edge.
  // If you want strict protection, move token to HTTP-only cookie.

  if (!isPublic) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


