// Cole este código em: app/api/permissions/requests/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { verifyToken } from "@/lib/jwt";
import { parse } from "cookie";

const prisma = new PrismaClient();

type Body = {
  capexLabel: string;
  reason?: string;
};

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) throw new Error("Cabeçalho de cookie não foi encontrado na requisição.");

    const parsedCookies = parse(cookieHeader);
    const token = parsedCookies.auth;
    if (!token) throw new Error("Token de autenticação não foi encontrado nos cookies.");

    const payload = await verifyToken(token);
    const email = (payload as any)?.email;
    if (!email) throw new Error("O token é válido, mas não contém um email.");

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });

    const body = (await req.json().catch(() => ({}))) as Partial<Body>;
    const capexLabel = String(body?.capexLabel ?? "").trim();
    if (!capexLabel) {
      return NextResponse.json({ error: "capexLabel é obrigatório" }, { status: 400 });
    }

    // CORREÇÃO AQUI: de permissionRequest para permissionrequest
    const existing = await prisma.permissionrequest.findFirst({
      where: { userId: user.id, capexLabel, status: "PENDING" },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ success: true, requestId: existing.id, alreadyPending: true }, { status: 200 });
    }

    // E CORREÇÃO AQUI: de permissionRequest para permissionrequest
    const created = await prisma.permissionrequest.create({
      data: {
        userId: user.id,
        capexLabel,
        reason: body.reason ? String(body.reason).trim() : null,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, requestId: created.id }, { status: 201 });

  } catch (err: any) {
    console.error("ERRO EM /api/permissions/requests:", err.message);
    return NextResponse.json({ error: "unauthorized", details: err.message }, { status: 401 });
  }
}
