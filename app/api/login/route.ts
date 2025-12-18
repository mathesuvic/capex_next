// app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { signJWT } from '@/lib/jwt';
// import prisma/compare conforme seu projeto

const AUTH_COOKIE = 'auth';

export async function POST(req: NextRequest) {
  const { email, password, next } = await req.json();

  // ... valide credenciais (prisma + compare)

  const token = await signJWT({ sub: user.id, email: user.email, role: user.role });

  const res = NextResponse.json({ ok: true, redirectTo: next || '/home' });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return res;
}
