// app/api/capex/physical-inputs/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema para um item físico
const PhysicalItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1, "O nome do físico não pode ser vazio."),
  risco: z.enum(['BAIXO', 'MEDIO', 'ALTO']),
  jan: z.number().optional().default(0), fev: z.number().optional().default(0),
  mar: z.number().optional().default(0), abr: z.number().optional().default(0),
  mai: z.number().optional().default(0), jun: z.number().optional().default(0),
  jul: z.number().optional().default(0), ago: z.number().optional().default(0),
  set: z.number().optional().default(0), out: z.number().optional().default(0),
  nov: z.number().optional().default(0), dez: z.number().optional().default(0),
});

// =================================================================
// Schema do POST agora espera 'editableMonths'
// =================================================================
const PostSchema = z.object({
  capexLabel: z.string().min(1),
  items: z.array(PhysicalItemSchema),
  editableMonths: z.array(z.string()),
});

// GET não precisa de alterações
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const capexLabel = searchParams.get('capexLabel');
    if (!capexLabel) {
      return NextResponse.json({ error: 'O parâmetro capexLabel é obrigatório.' }, { status: 400 });
    }
    const physicalInputs = await prisma.physicalInput.findMany({
      where: { capexLabel },
      orderBy: { createdAt: 'asc' },
    });
    const plainObjects = physicalInputs.map(item => {
        const newItem: Record<string, any> = { ...item };
        for (const key in newItem) {
            if (newItem[key] instanceof Prisma.Decimal) {
                newItem[key] = newItem[key].toNumber();
            }
        }
        return newItem;
    });
    return NextResponse.json(plainObjects);
  } catch (error) {
    console.error("Erro ao buscar físicos:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// POST totalmente corrigido
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = PostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.format() }, { status: 400 });
    }

    // Agora recebemos a lista de meses a serem comparados
    const { capexLabel, items, editableMonths } = validation.data;

    await prisma.$transaction(async (tx) => {
      // ETAPA 1: Sincronizar físicos (sem alterações)
      const incomingIds = items.map(item => typeof item.id === 'number' ? item.id : null).filter((id): id is number => id !== null);
      const existingItems = await tx.physicalInput.findMany({ where: { capexLabel }, select: { id: true } });
      const existingIds = existingItems.map(item => item.id);
      const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
      if (idsToDelete.length > 0) {
        await tx.physicalInput.deleteMany({ where: { id: { in: idsToDelete } } });
      }
      const itemsToCreate = items.filter(item => typeof item.id === 'string');
      const itemsToUpdate = items.filter((item): item is (typeof items[0] & { id: number }) => typeof item.id === 'number');
      if (itemsToCreate.length > 0) {
        await tx.physicalInput.createMany({
          data: itemsToCreate.map(({ id, ...rest }) => ({ ...rest, capexLabel: capexLabel })),
        });
      }
      for (const item of itemsToUpdate) {
        await tx.physicalInput.update({
          where: { id: item.id },
          data: { name: item.name, risco: item.risco, jan: item.jan, fev: item.fev, mar: item.mar, abr: item.abr, mai: item.mai, jun: item.jun, jul: item.jul, ago: item.ago, set: item.set, out: item.out, nov: item.nov, dez: item.dez },
        });
      }

      // ETAPA 2: Calcular e atualizar status (lógica corrigida)
      let newStatus: 'SIM' | 'NAO' | 'PENDENTE';

      if (items.length === 0) {
        newStatus = 'PENDENTE';
      } else {
        const financialCapex = await tx.capexWeb.findUnique({
          where: { capex: capexLabel },
        });

        if (!financialCapex) {
            throw new Error(`Registro financeiro para o capex '${capexLabel}' não encontrado.`);
        }
        
        newStatus = 'SIM'; // Começa assumindo que está tudo certo

        // =================================================================
        // CORREÇÃO: O loop agora itera sobre a lista de meses recebida,
        // garantindo que apenas os meses relevantes sejam comparados.
        // =================================================================
        for (const month of editableMonths) {
          const physicalTotalForMonth = items.reduce((sum, item) => sum + (item[month] || 0), 0);
          const financialValueForMonth = financialCapex[`${month}_ano` as keyof typeof financialCapex];
          const financialNumber = financialValueForMonth ? Number(financialValueForMonth) : 0;
          
          if (Math.abs(physicalTotalForMonth - financialNumber) > 0.01) {
            newStatus = 'NAO'; // Se um mês falhar, o status é NÃO e paramos.
            break; 
          }
        }
      }
      
      // Atualiza o status na tabela principal
      await tx.capexWeb.update({
        where: { capex: capexLabel },
        data: { status_fisico: newStatus },
      });
    });

    return NextResponse.json({ message: 'Detalhamento físico salvo e status atualizado com sucesso.' }, { status: 200 });

  } catch (error) {
    console.error("Erro ao salvar físicos e atualizar status:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
         return NextResponse.json({ error: 'Erro: Já existe um item com o mesmo nome para este CAPEX.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
