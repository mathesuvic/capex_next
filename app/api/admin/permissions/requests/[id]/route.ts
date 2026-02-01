// app/api/admin/permissions/requests/[id]/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserOrThrow, isAdminEmail } from "@/lib/auth";

export async function PATCH(request: Request) {
  // O SEGUNDO PARÂMETRO {params} FOI REMOVIDO PARA IGNORAR O BUG DO NEXT.JS

  try {
    const user = await getCurrentUserOrThrow();

    if (user.role !== "ADMIN" && !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- INÍCIO DA CORREÇÃO DEFINITIVA ---
    // Vamos extrair o ID manualmente da URL para contornar o bug do Next.js
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments.pop(); // Pega o último segmento da URL, que é o ID
    // --- FIM DA CORREÇÃO DEFINITIVA ---

    if (!id || id === '[id]') { // Checagem de segurança adicional
      console.error("Falha crítica: O ID da rota não foi lido da URL.");
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
    
    // Se o status for "APPROVED", usamos uma transação para garantir a consistência dos dados
    if (status === "APPROVED") {
      // Usando uma transação para garantir que ambas as operações funcionem ou nenhuma delas.
      const [updatedRequest] = await prisma.$transaction([
        // 1. Atualiza a solicitação de permissão
        prisma.permissionRequest.update({
          where: { id: id },
          data: {
            status: "APPROVED",
            decidedAt: new Date(),
            decidedByUserId: user.id,
          },
        }),
        // 2. Cria a permissão de Capex correspondente
        prisma.capexPermission.create({
          data: {
            userId: user.id, // ou o ID do solicitante, dependendo da sua regra de negócio
            capexLabel: (await prisma.permissionRequest.findUnique({ where: { id } }))?.capexLabel || 'unknown',
            // Adicione outros campos necessários para CapexPermission aqui
          }
        })
      ]);
      
      return NextResponse.json(updatedRequest);

    } else {
      // Se for "REJECTED", apenas atualiza a solicitação
      const updatedRequest = await prisma.permissionRequest.update({
        where: { id: id },
        data: {
          status: "REJECTED",
          decidedAt: new Date(),
          decidedByUserId: user.id,
        },
      });
      return NextResponse.json(updatedRequest);
    }

  } catch (error: any) {
    console.error("Erro ao aprovar/rejeitar solicitação:", error);
    // Verificação para erro de transação do Prisma
    if (error.code === 'P2002') { // Exemplo: erro de chave única
        return NextResponse.json({ error: 'Database transaction failed: A permission for this user and capex might already exist.' }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
