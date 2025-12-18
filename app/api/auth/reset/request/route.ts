import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { createHash } from 'crypto';

export async function POST(req: Request) {
  const { email } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  // sempre responda 200 para não vazar existência
  if (!user) return NextResponse.json({ ok: true });

  const tokenPlain = crypto.randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(tokenPlain).digest('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30min

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: expires },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/reset?token=${tokenPlain}`;
  // Enviar e-mail aqui (nodemailer) — opcional em dev:
  return NextResponse.json({ ok: true, devToken: tokenPlain }); // remover devToken em prod
}
