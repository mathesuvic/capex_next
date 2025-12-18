import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { z } from 'zod';
import { cookies } from 'next/headers';

export const runtime = 'nodejs'; // importante p/ Prisma

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = schema.parse(body);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'USER' },
      select: { id: true, email: true, role: true },
    });

    const token = await signToken({ sub: user.id, email: user.email, role: user.role as any });
    (await cookies()).set('auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    console.error('Register error:', e);
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 });
  }
}
