// app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { signToken, AUTH_COOKIE } from '@/lib/jwt'; // ✅ CORREÇÃO

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { email, password, next } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Informe e-mail e senha' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: 'Credenciais inválidas' },
      { status: 401 },
    );
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: 'Credenciais inválidas' },
      { status: 401 },
    );
  }

  // ✅ CORREÇÃO: Usa a nova função signToken centralizada
  const token = await signToken({
    sub: user.id,
    email: user.email,
    name: user.name, // envia o nome para o payload
    role: user.role,
  });

  const res = NextResponse.json({ ok: true, redirectTo: next || '/home' });

  // ✅ CORREÇÃO: Usa a constante AUTH_COOKIE centralizada
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 dia
  });

  return res;
}
