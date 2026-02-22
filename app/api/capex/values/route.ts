// app/api/capex/values/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma, PhysicalStatus } from "@prisma/client";
import { getCurrentUserOrNull } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";

export const runtime = "nodejs";

type Body = {
  month: number;
  value: number | string;
  label: string; // deve bater com capexWeb.capex (a coluna usada no where)
};

const monthColumnMap: Record<number, keyof Prisma.CapexWebUpdateInput> = {
  1: "jan_ano", 2: "fev_ano", 3: "mar_ano", 4: "abr_ano", 5: "mai_ano", 6: "jun_ano",
  7: "jul_ano", 8: "ago_ano", 9: "set_ano", 10: "out_ano", 11: "nov_ano", 12: "dez_ano",
};

// Array com todos os nomes de colunas de meses para facilitar a soma
const ALL_MONTH_COLUMNS = Object.values(monthColumnMap);

export async function PUT(request: Request) {
  // ✅ Sua verificação de login original, mantida.
  const me = await getCurrentUserOrNull();
  if (!me) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<Body>;

    // ✅ Sua validação original, mantida.
    if (!body?.label) {
      return NextResponse.json({ error: "O 'label' (nome do capex) é obrigatório." }, { status: 400 });
    }
    if (typeof body.month !== "number" || !Number.isInteger(body.month)) {
      return NextResponse.json({ error: "O 'month' deve ser um número inteiro (1-12)." }, { status: 400 });
    }
    const columnName = monthColumnMap[body.month];
    if (!columnName) {
      return NextResponse.json({ error: "Mês inválido. Use valores de 1 a 12." }, { status: 400 });
    }
    const valueNum = typeof body.value === "string" ? Number(body.value) : typeof body.value === "number" ? body.value : NaN;
    if (!Number.isFinite(valueNum)) {
      return NextResponse.json({ error: "O 'value' deve ser numérico." }, { status: 400 });
    }

    // ✅ Sua checagem de permissão original, mantida.
    if (me.role !== "ADMIN") {
      const perm = await prisma.capexPermission.findFirst({
        where: { userId: me.id, capexLabel: body.label },
        select: { id: true },
      });
      if (!perm) {
        return NextResponse.json(
          { error: "forbidden", message: "Você não tem permissão para editar este CAPEX." },
          { status: 403 }
        );
      }
    }

    // ✅✅✅ CORREÇÃO PRINCIPAL: Usando uma transação para garantir a consistência dos dados ✅✅✅
    // Atualiza o valor do mês e recalcula o status físico em uma única operação atômica.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualiza o valor do mês (sua lógica original)
      await tx.capexWeb.update({
        where: { capex: body.label! },
        data: { [columnName]: valueNum },
      });

      // 2. Busca o registro recém-atualizado junto com seus inputs físicos
      const capexRecord = await tx.capexWeb.findUnique({
        where: { capex: body.label! },
        include: { physicalInputs: true },
      });

      if (!capexRecord) {
        // Isso não deve acontecer se a primeira query funcionou, mas é uma boa prática
        throw new Error("P2025"); 
      }

      // 3. Calcula o total financeiro somando todos os 12 meses do registro atualizado
      const financialTotal = ALL_MONTH_COLUMNS.reduce((sum, col) => {
        const monthValue = capexRecord[col as keyof typeof capexRecord] as Decimal | null;
        return sum + (monthValue ? monthValue.toNumber() : 0);
      }, 0);
      
      // 4. Calcula o total físico
      const physicalTotal = capexRecord.physicalInputs.reduce((sum, input) => {
        return sum + input.value.toNumber();
      }, 0);

      // 5. Determina o novo status físico
      let newStatus: PhysicalStatus = 'PENDENTE';
      if (capexRecord.physicalInputs.length > 0) {
        // Usamos uma pequena tolerância para evitar problemas com ponto flutuante
        if (Math.abs(physicalTotal - financialTotal) < 0.01) {
          newStatus = 'SIM';
        } else {
          newStatus = 'NAO';
        }
      }

      // 6. Atualiza o status_fisico no banco e retorna o resultado final da transação
      return tx.capexWeb.update({
        where: { capex: body.label! },
        data: { status_fisico: newStatus },
      });
    });

    return NextResponse.json(
      { success: true, updatedCapex: result.capex, newStatus: result.status_fisico },
      { status: 200 }
    );
  } catch (e) {
    // ✅ Sua gestão de erros original, mantida e aprimorada.
    // O erro "P2025" da transação será capturado aqui.
    if ((e instanceof Error && e.message === "P2025") || (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")) {
      return NextResponse.json({ error: "CAPEX não encontrado para o label informado." }, { status: 404 });
    }
    console.error("PUT /api/capex/values erro:", e);
    const errorMessage = e instanceof Error ? e.message : "Erro interno desconhecido";
    return NextResponse.json({ error: "internal", details: errorMessage }, { status: 500 });
  }
}
