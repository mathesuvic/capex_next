// app/api/capex/transfers/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  // TODO: Adicionar verificação de permissão do usuário aqui.

  try {
    const body = await request.json();
    // O 'fromLabel' que vem do frontend é, na verdade, o campo 'capex' do seu schema.
    const { fromLabel, transfers } = body as {
      fromLabel?: string;
      transfers?: Array<{ amount: number; to: string }>;
    };

    if (!fromLabel || !Array.isArray(transfers)) {
      return NextResponse.json(
        { error: "Dados inválidos. 'fromLabel' e 'transfers' (array) são obrigatórios." },
        { status: 400 }
      );
    }

    const savedAndFormattedTransfers = await prisma.$transaction(async (tx) => {
      // Passo 1: Encontrar o item de origem usando o modelo e campo corretos.
      // ANTES: tx.subPlan.findUnique({ where: { label: fromLabel } })
      // CORRETO: tx.capexWeb.findUnique({ where: { capex: fromLabel } })
      const originItem = await tx.capexWeb.findUnique({
        where: { capex: fromLabel },
      });

      if (!originItem) {
        throw new Error(`Item de origem "${fromLabel}" não foi encontrado.`);
      }

      // Passo 2: Deletar as transferências antigas usando o campo de relação correto.
      // ANTES: where: { subplanoOrigemId: originSubPlan.id }
      // CORRETO: where: { fromCapex: originItem.capex }
      await tx.transfer.deleteMany({
        where: { fromCapex: originItem.capex },
      });

      // Passo 3: Criar as novas transferências (se houver).
      if (transfers.length > 0) {
        // Os labels de destino também são o campo 'capex'.
        const destinationLabels = transfers.map((t) => t.to);

        // Encontra os itens de destino usando o modelo e campo corretos.
        // ANTES: tx.subPlan.findMany({ where: { label: { in: destinationLabels } } })
        // CORRETO: tx.capexWeb.findMany({ where: { capex: { in: destinationLabels } } })
        const destinationItems = await tx.capexWeb.findMany({
          where: { capex: { in: destinationLabels } },
        });

        // O 'id' aqui é o próprio campo 'capex'.
        const destinationMap = new Map(destinationItems.map((d) => [d.capex, d.capex]));

        // Prepara os dados para inserção usando os nomes de coluna corretos.
        // ANTES: { subplanoOrigemId, subplanoDestinoId, amount }
        // CORRETO: { fromCapex, toCapex, amount }
        const dataToCreate = transfers.map((t) => {
          const destinationCapex = destinationMap.get(t.to);
          if (!destinationCapex) {
            throw new Error(`Item de destino "${t.to}" não encontrado.`);
          }
          return {
            fromCapex: originItem.capex, // O campo 'capex' da origem
            toCapex: destinationCapex,    // O campo 'capex' do destino
            amount: t.amount,
          };
        });

        // Cria as novas transferências.
        await tx.transfer.createMany({
          data: dataToCreate,
        });
      }

      // Passo 4: Busca e retorna o estado final das transferências da origem.
      // ANTES: where: { subplanoOrigemId: ... }, include: { to: { select: { label: true } } }
      // CORRETO: where: { fromCapex: ... }, include: { to: { select: { capex: true } } }
      return tx.transfer.findMany({
        where: { fromCapex: originItem.capex },
        include: {
          to: {
            select: { capex: true } // Selecionamos o campo 'capex' do destino
          }
        },
      });
    });

    // Passo 5: Formata a resposta para o frontend.
    // ANTES: to: t.to.label
    // CORRETO: to: t.to.capex
    const responsePayload = savedAndFormattedTransfers.map(t => ({
      id: t.id,
      amount: Number(t.amount), // Garante que o valor retornado seja um número
      to: t.to.capex,
    }));
    
    return NextResponse.json(responsePayload, { status: 200 });

  } catch (e) {
    console.error("PUT /api/capex/transfers erro:", e);
    const errorMessage = e instanceof Error ? e.message : "Erro interno desconhecido";
    return NextResponse.json({ error: "internal", details: errorMessage }, { status: 500 });
  }
}
