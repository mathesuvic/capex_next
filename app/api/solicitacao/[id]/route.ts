// app/api/solicitacao/[id]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Esta rota agora permite que um usuário edite sua própria PermissionRequest
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CORREÇÃO FINAL: de 'PermissionRequest' (PascalCase) para 'permissionRequest' (camelCase)
    const requestToEdit = await prisma.permissionRequest.findUnique({
      where: { id: id },
    });

    if (!requestToEdit) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }

    if (requestToEdit.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Você não tem permissão para editar esta solicitação' }, { status: 403 });
    }

    const body = await req.json();

    // E CORREÇÃO FINAL AQUI TAMBÉM: 'permissionRequest'
    const updatedRequest = await prisma.permissionRequest.update({
      where: { id: id },
      data: {
        reason: body.reason,
      },
    });

    return NextResponse.json({ ok: true, data: updatedRequest });

  } catch (err: any) {
    // Acessar context.params aqui pode dar erro se a Promise rejeitar, então vamos ser mais seguros
    console.error(`Erro em PUT /api/solicitacao/[id]:`, err.message);
    return NextResponse.json({ error: 'Erro no servidor', details: err.message }, { status: 500 });
  }
}
