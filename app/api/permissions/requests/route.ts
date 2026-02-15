// app/api/permissions/requests/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { parse } from "cookie";

// --- MUDANÇA 1: O corpo da requisição agora espera um array 'capexLabels' ---
type Body = {
  capexLabels: string[];
  reason?: string;
};

export async function POST(req: Request) {
  try {
    // --- Autenticação (lógica original mantida) ---
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) throw new Error("Cabeçalho de cookie não foi encontrado na requisição.");

    const parsedCookies = parse(cookieHeader);
    const token = parsedCookies.auth;
    if (!token) throw new Error("Token de autenticação não foi encontrado nos cookies.");

    const payload = await verifyToken(token);
    const email = (payload as any)?.email;
    if (!email) throw new Error("O token é válido, mas não contém um email.");

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    
    // --- MUDANÇA 2: Lendo e validando o array de labels ---
    const body = (await req.json().catch(() => ({}))) as Partial<Body>;
    const { capexLabels, reason } = body;

    if (!Array.isArray(capexLabels) || capexLabels.length === 0) {
      return NextResponse.json({ error: "O array 'capexLabels' é obrigatório e não pode ser vazio." }, { status: 400 });
    }
    
    // --- MUDANÇA 3: Lógica para evitar duplicatas em massa ---
    // 1. Busca todas as solicitações PENDENTES que o usuário já fez para os planos enviados
    const existingPendingRequests = await prisma.permissionRequest.findMany({
      where: {
        userId: user.id,
        status: "PENDING",
        capexLabel: {
          in: capexLabels, // Verifica todos os labels do array de uma vez
        },
      },
      select: { capexLabel: true },
    });

    const pendingLabels = new Set(existingPendingRequests.map(p => p.capexLabel));

    // 2. Filtra a lista, mantendo apenas os labels que AINDA NÃO têm uma solicitação pendente
    const labelsToCreate = capexLabels.filter(label => !pendingLabels.has(label));
    
    // Se não houver novos labels para criar (todos já estão pendentes), retorna sucesso.
    if (labelsToCreate.length === 0) {
        return NextResponse.json({ success: true, message: "Todas as solicitações selecionadas já estavam pendentes." }, { status: 200 });
    }
    
    // --- MUDANÇA 4: Criando múltiplas solicitações de uma só vez ---
    // 3. Prepara os dados para serem inseridos em massa
    const newRequestsData = labelsToCreate.map(label => ({
      userId: user.id,
      capexLabel: label.trim(),
      reason: reason ? String(reason).trim() : null,
    }));

    // 4. Usa 'createMany' para uma inserção eficiente no banco de dados
    await prisma.permissionRequest.createMany({
      data: newRequestsData,
    });

    return NextResponse.json({ success: true, message: `${newRequestsData.length} solicitações criadas com sucesso.` }, { status: 201 });

  } catch (err: any) {
    console.error("ERRO EM /api/permissions/requests:", err.message);
    // Mantém o tratamento de erro original
    return NextResponse.json({ error: "unauthorized", details: err.message }, { status: 401 });
  }
}
