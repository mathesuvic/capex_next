// lib/auth.ts
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET não definido ou muito curto no .env');
}
const secret = new TextEncoder().encode(JWT_SECRET);

// Tipos básicos do payload do token
export type AppRole = 'USER' | 'EDITOR' | 'ADMIN';
export type AppTokenPayload = JWTPayload & {
  email: string;
  role: AppRole;
};

// Hash e verificação de senha
export async function hashPassword(plain: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plain, saltRounds);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Assinar e verificar JWT
export async function signToken(
  payload: { sub: string; email: string; role?: AppRole },
  options?: { expiresIn?: string | number }
): Promise<string> {
  const exp = options?.expiresIn ?? '1d';
  return await new SignJWT({
    email: payload.email,
    role: payload.role ?? 'USER',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AppTokenPayload> {
  const { payload } = await jwtVerify<AppTokenPayload>(token, secret);
  return payload;
}

// Retorna o usuário atual a partir do cookie "auth"
export async function getCurrentUser():
  Promise<{ id: string; email: string; role: AppRole } | null> {
  const jar = await cookies();
  const token = jar.get('auth')?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return {
      id: payload.sub as string,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

// Autorização fina por registro (placeholder).
// Troque pela sua lógica real (ex.: checar vínculo do usuário ao plano).
export async function canEditPlan(userId: string, planId: string): Promise<boolean> {
  // TODO: implementar regra real com Prisma conforme seu schema
  return true;
}
