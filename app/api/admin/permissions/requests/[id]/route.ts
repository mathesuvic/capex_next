// app/api/admin/permissions/requests/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserOrThrow, isAdminEmail } from "@/lib/auth";

export const runtime = "nodejs";

type PatchBody =
  | { action: "approve" }
  | { action: "reject" };

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUserOrThrow();
    const isAdmin = me.role === "ADMIN" || isAdminEmail(me.email);
    if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Partial<PatchBody>;
    const action = body.action;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action inválida (approve|reject)" }, { status: 400 });
    }

    const reqRow = await prisma.permissionRequest.findUnique({
      where: { id },
      select: { id: true, userId: true, capexLabel: true, status: true },
    });

    if (!reqRow) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (reqRow.status !== "PENDING") {
      return NextResponse.json({ error: "already_decided", status: reqRow.status }, { status: 400 });
    }

    if (action === "approve") {
      await prisma.$transaction([
        prisma.permissionRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            decidedAt: new Date(),
            decidedByUserId: me.id,
          },
        }),
        prisma.capexPermission.upsert({
          where: { userId_capexLabel: { userId: reqRow.userId, capexLabel: reqRow.capexLabel } },
          update: {},
          create: { userId: reqRow.userId, capexLabel: reqRow.capexLabel },
        }),
      ]);

      return NextResponse.json({ ok: true, status: "APPROVED" }, { status: 200 });
    }

    // reject
    await prisma.permissionRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        decidedAt: new Date(),
        decidedByUserId: me.id,
      },
    });

    return NextResponse.json({ ok: true, status: "REJECTED" }, { status: 200 });
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 401;
    return NextResponse.json({ error: "unauthorized" }, { status });
  }
}
