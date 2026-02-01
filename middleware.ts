// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
// ✅ CORREÇÃO 1: Nome da função importada
import { verifyToken, AUTH_COOKIE } from '@/lib/jwt';

export const config = {
  // Sua lógica de rotas foi mantida
  matcher: [
    '/home',
    '/solicitacao/:path*',
    '/gerenciar-solicitacao/:path*',
    '/capex/:path*',
    '/admin/:path*',
    '/api/me',
    '/api/capex/:path*',
    '/api/solicitacao-recursos/:path*',
    '/api/admin/:path*',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAPI = pathname.startsWith('/api');
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  const toJSON = (status: number, body: any) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });

  if (!token) {
    if (isAPI) return toJSON(401, { error: 'unauthorized' });
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  try {
    // ✅ CORREÇÃO 2: Como o payload é extraído da função
    const payload = await verifyToken(token);
    const role = (payload as any)?.role;

    // Sua lógica de verificação de Admin foi mantida
    if (
      (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) &&
      role !== 'ADMIN'
    ) {
      if (isAPI) return toJSON(403, { error: 'forbidden' });
      const url = req.nextUrl.clone();
      url.pathname = '/home';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    // Sua lógica de erro foi mantida
    if (isAPI) return toJSON(401, { error: 'invalid_token' });
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    
    // Adicionado para limpar o cookie inválido
    const response = NextResponse.redirect(url);
    response.cookies.delete(AUTH_COOKIE);
    return response;
  }
}
