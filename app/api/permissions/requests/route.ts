// app/api/permissions/requests/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { parse } from "cookie";

// --------- FUNÇÃO GET PARA LISTAR SOLICITAÇÕES (PARA ADMINS) ---------
// Esta função busca a lista de solicitações para a sua página de "Aprovar solicitações"
export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const parsedCookies = parse(cookieHeader || "");
    const token = parsedCookies.auth_token;
    
    if (!token) {
      throw new Error("Acesso negado. Faça login para continuar.");
    }

    const payload = await verifyToken(token);
    const userRole = (payload as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado. Somente administradores podem ver as solicitações." }, { status: 403 });
    }

    const pendingRequests = await prisma.permissionRequest.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        // CORREÇÃO FINAL: Usando 'requester' para corresponder ao seu schema.prisma
        requester: { 
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(pendingRequests, { status: 200 });

  } catch (err: any) {
    console.error("ERRO NO GET /api/permissions/requests:", err.message);
    return NextResponse.json({ error: "unauthorized", details: err.message }, { status: 401 });
  }
}


// --------- FUNÇÃO POST PARA CRIAR NOVAS SOLICITAÇÕES ---------
// Esta função cria novas solicitações a partir do formulário
type Body = {
  capexLabels: string[];
  reason?: string;
};

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) throw new Error("Cabeçalho de cookie não foi encontrado na requisição.");

    const parsedCookies = parse(cookieHeader);
    const token = parsedCookies.auth_token;

    if (!token) throw new Error("Token de autenticação não foi encontrado nos cookies.");

    const payload = await verifyToken(token);
    const email = (payload as any)?.email;
    if (!email) throw new Error("O token é válido, mas não contém um email.");

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    
    const body = (await req.json().catch(() => ({}))) as Partial<Body>;
    const { capexLabels, reason } = body;

    if (!Array.isArray(capexLabels) || capexLabels.length === 0) {
      return NextResponse.json({ error: "O array 'capexLabels' é obrigatório e não pode ser vazio." }, { status: 400 });
    }
    
    const existingPendingRequests = await prisma.permissionRequest.findMany({
      where: {
        userId: user.id,
        status: "PENDING",
        capexLabel: {
          in: capexLabels,
        },
      },
      select: { capexLabel: true },
    });

    const pendingLabels = new Set(existingPendingRequests.map(p => p.capexLabel));
    const labelsToCreate = capexLabels.filter(label => !pendingLabels.has(label));
    
    if (labelsToCreate.length === 0) {
        return NextResponse.json({ success: true, message: "Todas as solicitações selecionadas já estavam pendentes." }, { status: 200 });
    }
    
    const newRequestsData = labelsToCreate.map(label => ({
      userId: user.id,
      capexLabel: label.trim(),
      reason: reason ? String(reason).trim() : null,
    }));

    await prisma.permissionRequest.createMany({
      data: newRequestsData,
    });

    return NextResponse.json({ success: true, message: `${newRequestsData.length} solicitações criadas com sucesso.` }, { status: 201 });

  } catch (err: any) {
    console.error("ERRO EM /api/permissions/requests:", err.message);
    return NextResponse.json({ error: "unauthorized", details: err.message }, { status: 401 });
  }
}
