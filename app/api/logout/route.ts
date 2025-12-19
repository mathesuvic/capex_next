// app/api/logout/route.ts
import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/jwt';

export const runtime = 'nodejs';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // zera o cookie no response (compatível com todos os runtimes)
  res.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
