// lib/jwt.ts
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const raw = process.env.JWT_SECRET;
if (!raw) throw new Error('JWT_SECRET ausente no .env');

const secret = new TextEncoder().encode(raw);

export const AUTH_COOKIE = 'auth';

// Assina um JWT
export async function signJWT(payload: JWTPayload, exp: string = '1d') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret);
}

// Compat: alguns trechos chamam signToken
export const signToken = signJWT;

// Verifica e retorna o objeto completo do jose (payload + header)
export async function verifyJWT(token: string) {
  return jwtVerify(token, secret);
}

// Verifica e retorna SOMENTE o payload (conveniência/compat)
export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
