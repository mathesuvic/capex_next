// lib/jwt.ts
import { SignJWT, jwtVerify } from 'jose';

const raw = process.env.JWT_SECRET;
if (!raw) throw new Error('JWT_SECRET ausente no .env');

const secret = new TextEncoder().encode(raw);

export async function signJWT(payload: Record<string, any>, exp: string = '1d') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret);
}

export async function verifyJWT(token: string) {
  return jwtVerify(token, secret); // lança erro se inválido
}
