// app/api/capex/physical-inputs/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema para um único item físico, usado no POST
const PhysicalItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1, "O nome do físico não pode ser vazio."),
  risco: z.enum(['BAIXO', 'MEDIO', 'ALTO']),
  jan: z.number().optional().default(0),
  fev: z.number().optional().default(0),
  mar: z.number().optional().default(0),
  abr: z.number().optional().default(0),
  mai: z.number().optional().default(0),
  jun: z.number().optional().default(0),
  jul: z.number().optional().default(0),
  ago: z.number().optional().default(0),
  set: z.number().optional().default(0),
  out: z.number().optional().default(0),
  nov: z.number().optional().default(0),
  dez: z.number().optional().default(0),
});

// Schema para o corpo da requisição POST
const PostSchema = z.object({
  // =================================================================
  // CORREÇÃO 2: A validação do Zod agora espera 'capexLabel'
  // =================================================================
  capexLabel: z.string().min(1),
  items: z.array(PhysicalItemSchema),
});

/**
 * GET: Busca todos os físicos para um determinado CAPEX.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // =================================================================
    // CORREÇÃO 1: O parâmetro na URL agora é lido como 'capexLabel'
    // =================================================================
    const capexLabel = searchParams.get('capexLabel');

    if (!capexLabel) {
      return NextResponse.json({ error: 'O parâmetro capexLabel é obrigatório.' }, { status: 400 });
    }

    const physicalInputs = await prisma.physicalInput.findMany({
      where: { capexLabel },
      orderBy: { createdAt: 'asc' },
    });

    // Converte os campos Decimal do Prisma para number para o frontend
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

/**
 * POST: Sincroniza (cria, atualiza, deleta) a lista de físicos para um CAPEX.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = PostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.format() }, { status: 400 });
    }

    // A validação agora retorna 'capexLabel'
    const { capexLabel, items } = validation.data;

    const incomingIds = items
      .map(item => typeof item.id === 'number' ? item.id : null)
      .filter((id): id is number => id !== null);

    await prisma.$transaction(async (tx) => {
      const existingItems = await tx.physicalInput.findMany({
        where: { capexLabel },
        select: { id: true },
      });
      const existingIds = existingItems.map(item => item.id);
      const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
      
      if (idsToDelete.length > 0) {
        await tx.physicalInput.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }

      const itemsToCreate = items.filter(item => typeof item.id === 'string');
      const itemsToUpdate = items.filter((item): item is (typeof items[0] & { id: number }) => typeof item.id === 'number');

      if (itemsToCreate.length > 0) {
        await tx.physicalInput.createMany({
          data: itemsToCreate.map(({ id, ...rest }) => ({
            ...rest,
            capexLabel: capexLabel,
          })),
        });
      }

      for (const item of itemsToUpdate) {
        await tx.physicalInput.update({
          where: { id: item.id },
          data: {
            name: item.name,
            risco: item.risco,
            jan: item.jan, fev: item.fev, mar: item.mar,
            abr: item.abr, mai: item.mai, jun: item.jun,
            jul: item.jul, ago: item.ago, set: item.set,
            out: item.out, nov: item.nov, dez: item.dez,
          },
        });
      }
    });

    return NextResponse.json({ message: 'Detalhamento físico salvo com sucesso.' }, { status: 200 });

  } catch (error) {
    console.error("Erro ao salvar físicos:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
         return NextResponse.json({ error: 'Erro: Já existe um item com o mesmo nome para este CAPEX.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
