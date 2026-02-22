// app/api/capex/physical-inputs/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';

// GET para buscar os físicos existentes de um CAPEX
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const capex = searchParams.get('capex');

    if (!capex) {
      return NextResponse.json({ error: 'Parâmetro "capex" é obrigatório' }, { status: 400 });
    }

    const physicalInputs = await prisma.physicalInput.findMany({
      where: { capexWebCapex: capex },
      orderBy: { createdAt: 'asc' },
    });

    // Convertendo Decimal para number para facilitar o uso no frontend
    const results = physicalInputs.map(item => ({
      ...item,
      value: item.value.toNumber(),
    }));

    return NextResponse.json(results);

  } catch (error) {
    console.error("Erro ao buscar inputs físicos:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}


// POST para salvar os físicos e atualizar o status
const inputSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  value: z.number().min(0, "O valor deve ser positivo"),
});

const postSchema = z.object({
  capex: z.string().min(1),
  inputs: z.array(inputSchema),
  targetTotal: z.number(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validation = postSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.format() }, { status: 400 });
    }

    const { capex, inputs, targetTotal } = validation.data;

    const physicalTotal = inputs.reduce((sum, item) => sum + item.value, 0);

    let newStatus: 'SIM' | 'NAO' | 'PENDENTE' = 'PENDENTE';
    if (inputs.length > 0) {
      // Usamos uma margem de 1 centavo para a comparação
      if (Math.abs(physicalTotal - targetTotal) < 0.01) {
        newStatus = 'SIM';
      } else {
        newStatus = 'NAO';
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.physicalInput.deleteMany({
        where: { capexWebCapex: capex },
      });

      if (inputs.length > 0) {
        await tx.physicalInput.createMany({
          data: inputs.map(input => ({
            name: input.name,
            value: new Decimal(input.value),
            capexWebCapex: capex,
          })),
        });
      }

      await tx.capexWeb.update({
        where: { capex: capex },
        data: { status_fisico: newStatus },
      });
    });

    return NextResponse.json({ success: true, newStatus: newStatus }, { status: 200 });

  } catch (error) {
    console.error("Erro ao salvar inputs físicos:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
