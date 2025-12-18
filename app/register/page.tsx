// app/api/register/route.ts (exemplo)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { signToken, AUTH_COOKIE } from "@/lib/jwt";
import { hash } from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });

  const passwordHash = await hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, email: true, role: true },
  });

  const token = await signToken({ sub: user.id, email: user.email, role: user.role });

  // seta cookie após registrar
  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return NextResponse.json({ ok: true, user });
}
