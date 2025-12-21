// lib/auth.ts
import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { AUTH_COOKIE, verifyToken } from "@/lib/jwt";

export type AppRole = "USER" | "EDITOR" | "ADMIN";

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/**
 * Admin "fixo" por env (opcional)
 * .env: ADMIN_EMAILS=matheus.paiva@neoenergia.com,outro@neoenergia.com
 */
export function isAdminEmail(email: string) {
  const list =
    process.env.ADMIN_EMAILS?.split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean) ?? [];
  return list.includes(email.toLowerCase());
}

/**
 * Retorna o usuário logado (do BANCO) ou null.
 * - Usa JWT só para identificar email
 * - Garante que o User exista no banco (upsert)
 */
export async function getCurrentUserOrNull() {
  // ✅ Next atual: cookies() é async
  const jar = await cookies();

  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await verifyToken(token);

    const email = String((payload as any).email ?? "").trim().toLowerCase();
    if (!email) return null;

    // opcional: se quiser nome no futuro
    const name = (payload as any).name ? String((payload as any).name) : null;

    const user = await prisma.user.upsert({
      where: { email },
      update: { name: name ?? undefined },
      create: {
        email,
        name,
        // se o email estiver na whitelist, já cria como ADMIN
        role: isAdminEmail(email) ? "ADMIN" : "USER",
      },
      select: { id: true, email: true, role: true, name: true },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role as AppRole,
      name: user.name ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Igual ao de cima, mas lança erro se não estiver logado.
 * Útil em API routes para retornar 401/403.
 */
export async function getCurrentUserOrThrow() {
  const user = await getCurrentUserOrNull();
  if (!user) {
    const err = new Error("UNAUTHORIZED");
    (err as any).status = 401;
    throw err;
  }
  return user;
}

/**
 * Compatibilidade
 */
export async function getCurrentUser() {
  return getCurrentUserOrNull();
}
