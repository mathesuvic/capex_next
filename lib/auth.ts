// lib/auth.ts
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { AUTH_COOKIE, verifyToken } from '@/lib/jwt';

export type AppRole = 'USER' | 'EDITOR' | 'ADMIN';

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function getCurrentUser() {
  const jar = cookies(); // não é async
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await verifyToken(token); // aqui já é o payload
    return {
      id: String(payload.sub ?? ''),
      email: String((payload as any).email ?? ''),
      role: ((payload as any).role ?? 'USER') as AppRole,
    };
  } catch {
    return null;
  }
}
