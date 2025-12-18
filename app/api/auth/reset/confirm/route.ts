import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createHash } from 'crypto';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const { token, password } = await req.json();
  const tokenHash = createHash('sha256').update(token).digest('hex');

  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  if (!record) return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
