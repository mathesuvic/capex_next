// app/api/physical-inputs/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Adapte o caminho se seu prisma client estiver em outro lugar
import { z } from 'zod';

// Schema para validar os dados de busca (quando o modal abre)
const GetSchema = z.object({
  capex: z.string().min(1, "O CAPEX é obrigatório."),
  month: z.coerce.number().int().min(1, "O mês deve ser entre 1 e 12.").max(12),
});

// Schema para validar os dados que serão salvos (quando o usuário clica em Salvar)
const PostSchema = z.object({
  capex: z.string().min(1),
  month: z.number().int().min(1).max(12),
  items: z.array(z.object({
    name: z.string().min(1, "O nome do físico não pode ser vazio."),
    value: z.number().positive("O valor deve ser maior que zero."),
  })),
  totalValue: z.number().min(0),
});

/**
 * Função GET: Busca os físicos para um determinado subplano e mês.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = GetSchema.safeParse({
      capex: searchParams.get('capex'),
      month: searchParams.get('month'),
    });

    if (!validation.success) {
      return NextResponse.json({ error: 'Parâmetros inválidos.', details: validation.error.format() }, { status: 400 });
    }

    const { capex, month } = validation.data;

    const physicalInputs = await prisma.physicalInput.findMany({
      where: {
        capexWebCapex: capex,
        month,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(physicalInputs);

  } catch (error) {
    console.error("Erro ao buscar físicos:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

/**
 * Função POST: Salva (sobrescreve) a lista de físicos para um subplano e mês.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = PostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.format() }, { status: 400 });
    }

    const { capex, month, items, totalValue } = validation.data;

    // Mapeia o índice do mês (1-12) para o nome da coluna no banco (ex: jan_ano)
    const monthIndexToDbField: { [key: number]: string } = {
      1: 'jan_ano', 2: 'fev_ano', 3: 'mar_ano', 4: 'abr_ano', 5: 'mai_ano', 6: 'jun_ano',
      7: 'jul_ano', 8: 'ago_ano', 9: 'set_ano', 10: 'out_ano', 11: 'nov_ano', 12: 'dez_ano'
    };
    const monthField = monthIndexToDbField[month];
    if (!monthField) {
        return NextResponse.json({ error: 'Mês inválido.' }, { status: 400 });
    }


    // Usamos uma transação para garantir que ambas as operações (atualizar o total e salvar os físicos)
    // aconteçam com sucesso. Se uma falhar, a outra é desfeita.
    await prisma.$transaction(async (tx) => {
      // 1. Deleta todos os físicos antigos para este capex e mês
      await tx.physicalInput.deleteMany({
        where: {
          capexWebCapex: capex,
          month,
        },
      });

      // 2. Cria os novos físicos se a lista não estiver vazia
      if (items.length > 0) {
        await tx.physicalInput.createMany({
          data: items.map(item => ({
            name: item.name,
            value: item.value,
            month: month,
            capexWebCapex: capex,
          })),
        });
      }

      // 3. Atualiza o valor total do mês na tabela principal 'capex_web'
      await tx.capexWeb.update({
        where: { capex: capex },
        data: {
          [monthField]: totalValue,
        },
      });
    });

    return NextResponse.json({ message: 'Físicos e valor financeiro salvos com sucesso.' }, { status: 200 });

  } catch (error) {
    console.error("Erro ao salvar físicos:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
