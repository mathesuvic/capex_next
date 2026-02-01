// lib/jwt.ts
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// Nome do cookie que vamos usar
export const AUTH_COOKIE = 'auth_token';

// Chave secreta vinda do .env
const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('A variável JWT_SECRET não foi definida no arquivo .env');
}
const key = new TextEncoder().encode(secretKey);

/**
 * Cria (assina) um novo token JWT.
 */
export async function signToken(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Expira em 1 dia
    .sign(key);
}

/**
 * Verifica um token JWT. Retorna o payload se for válido, senão lança um erro.
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, key, {
    algorithms: ['HS256'],
  });
  return payload;
}
