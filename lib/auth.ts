// lib/auth.ts
import 'server-only';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import cuid from 'cuid';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE, verifyToken } from '@/lib/jwt';

export type AppRole = 'USER' | 'EDITOR' | 'ADMIN';

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function isAdminEmail(email: string) {
  const list =
    process.env.ADMIN_EMAILS?.split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean) ?? [];
  return list.includes(email.toLowerCase());
}

export async function getCurrentUserOrNull() {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await verifyToken(token);
    const email = String(payload.email ?? '').trim().toLowerCase();
    if (!email) return null;

    const name = payload.name ? String(payload.name) : null;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        ...(name !== null && { name }),
      },
      create: {
        id: cuid(),
        email,
        name,
        role: isAdminEmail(email) ? 'ADMIN' : 'USER',
      },
      select: { id: true, email: true, role: true, name: true },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role as AppRole,
      name: user.name ?? undefined,
    };
  } catch (error) {
    // ✅ ✅ ✅ A MUDANÇA ESTÁ AQUI ✅ ✅ ✅
    // Vamos printar o erro no console do servidor para descobrir a causa raiz.
    console.error("\n--- ERRO NA VALIDAÇÃO DO TOKEN ---");
    console.error(error);
    console.error("--- FIM DO ERRO ---\n");
    return null;
  }
}

export async function getCurrentUserOrThrow() {
  const user = await getCurrentUserOrNull();
  if (!user) {
    const err = new Error('UNAUTHORIZED');
    (err as any).status = 401;
    throw err;
  }
  return user;
}

export async function getCurrentUser() {
  return getCurrentUserOrNull();
}
