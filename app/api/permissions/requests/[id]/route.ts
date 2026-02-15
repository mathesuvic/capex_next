// app/api/permissions/requests/[id]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// A assinatura do 'context' precisa tratar 'params' como uma Promise.
// Esta é a forma correta para o seu ambiente.
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ details: 'Acesso negado. Requer privilégios de administrador.' }, { status: 403 });
    }

    // A CORREÇÃO FINAL E DEFINITIVA ESTÁ AQUI:
    // Usando 'await' para "desembrulhar" a Promise e obter o ID.
    const { id } = await context.params;
    
    // O resto do seu código que já estava bom.
    const body = await req.json();
    const { status } = body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ details: 'O status fornecido é inválido.' }, { status: 400 });
    }

    const existingRequest = await prisma.permissionRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json({ details: `Solicitação com ID ${id} não encontrada.` }, { status: 404 });
    }

    const updatedRequest = await prisma.permissionRequest.update({
      where: { id },
      data: {
        status,
        decidedAt: new Date(),
        decidedByUserId: user.id,
      },
    });

    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (err: any) {
    console.error("Erro ao atualizar a solicitação:", err);
    return NextResponse.json({ details: 'Ocorreu um erro no servidor ao tentar atualizar a solicitação.', errorDetails: err.message }, { status: 500 });
  }
}
