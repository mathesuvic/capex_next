// app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { signToken, AUTH_COOKIE } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  const { email, password, next } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Informe e-mail e senha' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const hash = (user as any).passwordHash ?? (user as any).password;
  const ok = await verifyPassword(password, String(hash));
  if (!ok) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const token = await signToken({
    sub: String((user as any).id),
    email: user.email,
    role: (user as any).role ?? 'USER',
  });

  const res = NextResponse.json({ ok: true, redirectTo: next || '/home' });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 dia
  });
  return res;
}
