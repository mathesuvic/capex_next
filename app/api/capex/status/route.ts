// app/api/capex/status/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { normalizeLabel } from '@/lib/utils';

const patchSchema = z.object({
  capex: z.string().min(1, 'O CAPEX é obrigatório.'),
  status: z.enum(['PENDENTE', 'FINALIZADO']),
});

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validation = patchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.format() }, { status: 400 });
    }
    
    const { capex, status } = validation.data;

    const userPermissions = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        role: true, 
        capexPermissions: { select: { capexLabel: true } }
      },
    });

    // >>> CORREÇÃO: Buscando o campo 'capex' em vez de 'label'.
    const subplanToUpdate = await prisma.capexWeb.findUnique({
      where: { capex },
      select: { capex: true } // O campo que contém o nome do subplano é 'capex'
    });

    if (!subplanToUpdate) {
        return NextResponse.json({ error: 'Subplano não encontrado.' }, { status: 404 });
    }

    // >>> CORREÇÃO: Usando subplanToUpdate.capex para a comparação.
    const canEdit = userPermissions?.role === 'ADMIN' || 
                    userPermissions?.capexPermissions.some(s => normalizeLabel(s.capexLabel) === normalizeLabel(subplanToUpdate.capex));

    if (!canEdit) {
      return NextResponse.json({ error: 'Você não tem permissão para editar este subplano.' }, { status: 403 });
    }

    const updatedSubplan = await prisma.capexWeb.update({
      where: { capex },
      data: {
        status_capex: status,
      },
    });

    return NextResponse.json(updatedSubplan, { status: 200 });

  } catch (error) {
    console.error("Erro ao atualizar status do CAPEX:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
