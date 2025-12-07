import { NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function PUT(request: Request) {
  try {
    // 1. Extrair os dados do corpo da requisição
    const body = await request.json(); // Ex: { month: 11, value: 12345, label: '1.1.1 - Subestações' }

    // Validação: Garante que o label (nome do capex) foi enviado
    if (!body.label) {
      return NextResponse.json({ error: "O 'label' (nome do capex) é obrigatório." }, { status: 400 });
    }

    // 2. Mapear o mês para a coluna do banco
    const monthColumnMap: { [key: number]: string } = {
      11: 'nov_ano',
      12: 'dez_ano',
    };
    const columnName = monthColumnMap[body.month];

    if (!columnName) {
      return NextResponse.json({ error: "Mês inválido." }, { status: 400 });
    }
    
    // 3. Executar a atualização usando o 'label' como 'where'
    await db.capexWeb.update({
      where: {
        capex: body.label, // Usando o identificador real do banco!
      },
      data: {
        [columnName]: body.value,
      },
    });

    return NextResponse.json({ success: true, updatedCapex: body.label }, { status: 200 });

  } catch (e) {
    console.error(`PUT /api/capex/values erro:`, e);
    const errorMessage = e instanceof Error ? e.message : 'Erro interno desconhecido';
    return NextResponse.json({ error: 'internal', details: errorMessage }, { status: 500 });
  }
}
