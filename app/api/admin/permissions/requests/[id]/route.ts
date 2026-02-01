// app/api/admin/permissions/requests/[id]/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserOrThrow, isAdminEmail } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const adminUser = await getCurrentUserOrThrow();

    if (adminUser.role !== "ADMIN" && !isAdminEmail(adminUser.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments.pop();

    if (!id || id === '[id]') {
      return NextResponse.json(
        { error: "Server error: Could not read route parameter from URL." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (status !== "APPROVED" && status !== "REJECTED") {
      return NextResponse.json(
        { error: "Invalid status provided. Must be APPROVED or REJECTED." },
        { status: 400 }
      );
    }
    
    // ✅ CORREÇÃO FINAL: Usando 'userId', o nome de campo que o Prisma confirmou existir.
    const originalRequest = await prisma.permissionRequest.findUnique({
      where: { id },
      select: {
        userId: true, // Garante que o ID do solicitante seja incluído
        capexLabel: true,
      }
    });

    if (!originalRequest || !originalRequest.userId) {
      return NextResponse.json({ error: "Permission request or original requester ID not found." }, { status: 404 });
    }
    
    if (status === "APPROVED") {
      const [updatedRequest] = await prisma.$transaction([
        prisma.permissionRequest.update({
          where: { id: id },
          data: {
            status: "APPROVED",
            decidedAt: new Date(),
            decidedByUserId: adminUser.id,
          },
        }),
        prisma.capexPermission.create({
          data: {
            userId: originalRequest.userId, // Agora este valor é o correto
            capexLabel: originalRequest.capexLabel,
          }
        })
      ]);
      
      return NextResponse.json(updatedRequest);

    } else { // REJECTED
      const updatedRequest = await prisma.permissionRequest.update({
        where: { id: id },
        data: {
          status: "REJECTED",
          decidedAt: new Date(),
          decidedByUserId: adminUser.id,
        },
      });
      return NextResponse.json(updatedRequest);
    }

  } catch (error: any) {
    console.error("Erro ao aprovar/rejeitar solicitação:", error);
    if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Database transaction failed: A permission for this user and capex might already exist.' }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
