// app/api/me/permissions/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

type PermissionsResponse =
  | { isAdmin: true; allowedLabels: "ALL" }
  | { isAdmin: false; allowedLabels: string[] };

/**
 * Normaliza um label para comparação: remove espaços, hífens e converte para minúsculas.
 * Ex: "2.3 - Cybersecurity" -> "2.3cybersecurity"
 */
const normalizeLabel = (str: string) => str.toLowerCase().replace(/[\s-]+/g, "");

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Se for ADMIN, libera tudo
    if (user.role === "ADMIN") {
      const response: PermissionsResponse = { isAdmin: true, allowedLabels: "ALL" };
      return NextResponse.json(response);
    }

    // Busca permissões aprovadas do usuário logado
    const requests = await prisma.permissionRequest.findMany({
      where: {
        userId: user.id, // precisa bater com o ObjectId do User
        status: "APPROVED",
      },
      select: { capexLabel: true },
      orderBy: { createdAt: "desc" },
    });

    // Retorna os labels "limpos" (normalizados) OU os originais — escolha 1
    // Opção A (normalizado para facilitar comparação no frontend):
    const allowedLabels = requests.map((r) => normalizeLabel(r.capexLabel));

    // Opção B (original, como no banco):
    // const allowedLabels = requests.map((r) => r.capexLabel);

    const response: PermissionsResponse = {
      isAdmin: false,
      allowedLabels,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro em /api/me/permissions:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
