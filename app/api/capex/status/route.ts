// app/api/capex/status/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { capexLabel } = (await req.json()) as { capexLabel: string };
    if (!capexLabel) {
      return NextResponse.json({ error: 'O "capexLabel" é obrigatório' }, { status: 400 });
    }

    // Verifica a permissão do usuário
    const isAdmin = user.role === 'ADMIN';
    let hasPermission = isAdmin;

    if (!isAdmin) {
      const permission = await prisma.capexPermission.findUnique({
        where: { userId_capexLabel: { userId: user.id, capexLabel } },
      });
      if (permission) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Acesso negado. Você não tem permissão para este subplano.' }, { status: 403 });
    }
    
    // Atualiza o status no banco de dados
    const updatedCapex = await prisma.capexWeb.update({
      where: { capex: capexLabel },
      data: { status_capex: 'FINALIZADO' },
    });

    return NextResponse.json(updatedCapex);

  } catch (error: any) {
    console.error("Falha ao atualizar status do capex:", error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}
