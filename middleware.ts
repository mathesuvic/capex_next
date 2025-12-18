// middleware.ts (ou proxy.ts, mas use apenas UM deles)
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

export const config = {
  matcher: ['/capex/:path*', '/api/capex/:path*', '/admin/:path*', '/api/admin/:path*'],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('auth')?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await verifyJWT(token);
    const role = (payload as any)?.role;

    if ((pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) && role !== 'ADMIN') {
      const url = req.nextUrl.clone();
      url.pathname = '/home';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (e) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
}
