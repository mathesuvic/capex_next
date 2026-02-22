// app/api/physical-inputs/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// >>> ALTERADO: Schema de busca agora só precisa do CAPEX. O mês foi removido.
const GetSchema = z.object({
  capex: z.string().min(1, "O CAPEX é obrigatório."),
});

// >>> ALTERADO: Schema de salvamento agora só precisa do CAPEX e dos itens.
// O mês e o totalValue foram removidos, pois a API não lida mais com isso.
const PostSchema = z.object({
  capex: z.string().min(1),
  items: z.array(z.object({
    name: z.string().min(1, "O nome do físico não pode ser vazio."),
    value: z.number().positive("O valor deve ser maior que zero."),
  })),
});

/**
 * Função GET: Busca TODOS os físicos para um determinado subplano (capex),
 * independentemente do mês.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = GetSchema.safeParse({
      capex: searchParams.get('capex'),
    });

    if (!validation.success) {
      return NextResponse.json({ error: 'Parâmetros inválidos.', details: validation.error.format() }, { status: 400 });
    }

    const { capex } = validation.data;

    // >>> ALTERADO: A busca no banco não filtra mais por 'month'.
    const physicalInputs = await prisma.physicalInput.findMany({
      where: {
        capexWebCapex: capex,
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
 * Função POST: Salva (sobrescreve) a lista de físicos para um subplano.
 * ATENÇÃO: Esta função NÃO atualiza mais a tabela financeira 'capex_web'.
 * Ela apenas salva o detalhamento na tabela 'physical_inputs'.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = PostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.format() }, { status: 400 });
    }

    // >>> ALTERADO: Não recebemos mais 'month' nem 'totalValue' do frontend.
    const { capex, items } = validation.data;
    
    // >>> REMOVIDO: Toda a lógica de mapeamento de mês para coluna de banco foi removida.
    
    await prisma.$transaction(async (tx) => {
      // 1. Deleta todos os físicos antigos para este capex (sem filtro de mês).
      await tx.physicalInput.deleteMany({
        where: {
          capexWebCapex: capex,
        },
      });

      // 2. Cria os novos físicos se a lista não estiver vazia.
      if (items.length > 0) {
        await tx.physicalInput.createMany({
          data: items.map(item => ({
            name: item.name,
            value: item.value,
            capexWebCapex: capex,
            // >>> ALTERADO: O campo 'month' não é mais fornecido, pois o schema o tornou opcional.
          })),
        });
      }

      // >>> REMOVIDO: A etapa 3, que atualizava a tabela 'capex_web', foi completamente removida.
      // A API não tem mais essa responsabilidade.
    });

    return NextResponse.json({ message: 'Detalhamento físico salvo com sucesso.' }, { status: 200 });

  } catch (error) {
    console.error("Erro ao salvar físicos:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
