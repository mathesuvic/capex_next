// app/api/capex/transfers/route.ts
// ESTE ARQUIVO ESTÁ CORRETO. NENHUMA ALTERAÇÃO NECESSÁRIA.

import { NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

// --- Função para CRIAR uma nova transferência ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fromLabel, toLabel, amount } = body;

    if (!fromLabel || !toLabel || amount === undefined) {
      return NextResponse.json({ error: "Dados incompletos para criar transferência." }, { status: 400 });
    }

    const newTransfer = await db.transfer.create({
      data: {
        amount: amount,
        from: {
          connect: { capex: fromLabel }
        },
        to: {
          connect: { capex: toLabel }
        }
      }
    });

    return NextResponse.json(newTransfer, { status: 201 });

  } catch (e) {
    console.error(`POST /api/capex/transfers erro:`, e);
    const errorMessage = e instanceof Error ? e.message : 'Erro interno desconhecido';
    return NextResponse.json({ error: 'internal', details: errorMessage }, { status: 500 });
  }
}


// --- Função para ATUALIZAR uma transferência existente ---
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, amount, toLabel } = body;

    if (!id) {
      return NextResponse.json({ error: "ID da transferência é obrigatório para atualizar." }, { status: 400 });
    }

    // Garante que o toLabel não seja nulo ou indefinido para a conexão
    if (!toLabel) {
       return NextResponse.json({ error: "O destino (toLabel) é obrigatório para atualizar." }, { status: 400 });
    }

    const updatedTransfer = await db.transfer.update({
      where: {
        id: id,
      },
      data: {
        amount: amount,
        to: {
          connect: { capex: toLabel }
        }
      },
    });

    return NextResponse.json(updatedTransfer, { status: 200 });

  } catch (e) {
    console.error(`PUT /api/capex/transfers erro:`, e);
    const errorMessage = e instanceof Error ? e.message : 'Erro interno desconhecido';
    return NextResponse.json({ error: 'internal', details: errorMessage }, { status: 500 });
  }
}

// --- Função para DELETAR uma transferência existente ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID da transferência é obrigatório para deletar." }, { status: 400 });
    }

    await db.transfer.delete({
      where: {
        id: Number(id), // Encontra e deleta a transferência pelo ID
      },
    });

    return NextResponse.json({ message: "Transferência deletada com sucesso." }, { status: 200 });

  } catch (e) {
    console.error(`DELETE /api/capex/transfers erro:`, e);
    const errorMessage = e instanceof Error ? e.message : 'Erro interno desconhecido';
    return NextResponse.json({ error: 'internal', details: errorMessage }, { status: 500 });
  }
}
