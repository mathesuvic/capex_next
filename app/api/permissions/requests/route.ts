// app/api/permissions/requests/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserOrThrow } from "@/lib/auth";

export const runtime = "nodejs";

type Body = {
  capexLabel: string;
  reason?: string;
};

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserOrThrow();
    const body = (await req.json().catch(() => ({}))) as Partial<Body>;

    const capexLabel = String(body?.capexLabel ?? "").trim();
    if (!capexLabel) {
      return NextResponse.json({ error: "capexLabel é obrigatório" }, { status: 400 });
    }

    // Evita duplicar solicitação pendente igual
    const existing = await prisma.permissionRequest.findFirst({
      where: { userId: user.id, capexLabel, status: "PENDING" },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ success: true, requestId: existing.id, alreadyPending: true }, { status: 200 });
    }

    const created = await prisma.permissionRequest.create({
      data: {
        userId: user.id,
        capexLabel,
        reason: body.reason ? String(body.reason).trim() : null,
        // status: "PENDING" // se seu schema já tem default, pode omitir
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, requestId: created.id }, { status: 201 });
  } catch (err: any) {
    // Se seu getCurrentUserOrThrow já lança com status, dá pra respeitar.
    const status = typeof err?.status === "number" ? err.status : 401;
    return NextResponse.json({ error: "unauthorized" }, { status });
  }
}
