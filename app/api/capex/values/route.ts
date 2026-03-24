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
  label: string;
};

const monthColumnMap: Record<number, keyof Prisma.CapexWebUpdateInput> = {
  1:  "jan_ano", 2:  "fev_ano", 3:  "mar_ano", 4:  "abr_ano",
  5:  "mai_ano", 6:  "jun_ano", 7:  "jul_ano", 8:  "ago_ano",
  9:  "set_ano", 10: "out_ano", 11: "nov_ano", 12: "dez_ano",
};

const ALL_MONTH_COLUMNS = Object.values(monthColumnMap);

export async function PUT(request: Request) {
  const me = await getCurrentUserOrNull();
  if (!me) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<Body>;

    if (!body?.label) {
      return NextResponse.json(
        { error: "O 'label' (nome do capex) é obrigatório." },
        { status: 400 }
      );
    }
    if (typeof body.month !== "number" || !Number.isInteger(body.month)) {
      return NextResponse.json(
        { error: "O 'month' deve ser um número inteiro (1-12)." },
        { status: 400 }
      );
    }
    const columnName = monthColumnMap[body.month];
    if (!columnName) {
      return NextResponse.json(
        { error: "Mês inválido. Use valores de 1 a 12." },
        { status: 400 }
      );
    }
    const valueNum =
      typeof body.value === "string"
        ? Number(body.value)
        : typeof body.value === "number"
        ? body.value
        : NaN;
    if (!Number.isFinite(valueNum)) {
      return NextResponse.json(
        { error: "O 'value' deve ser numérico." },
        { status: 400 }
      );
    }

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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualiza o valor do mês
      await tx.capexWeb.update({
        where: { capex: body.label! },
        data: { [columnName]: valueNum },
      });

      // 2. Busca o registro atualizado com os inputs físicos
      // ✅ CORRIGIDO: "physicalInputs" → "physicalinput" (nome exato do schema)
      const capexRecord = await tx.capexWeb.findUnique({
        where: { capex: body.label! },
        include: { physicalinput: true },
      });

      if (!capexRecord) {
        throw new Error("P2025");
      }

      // 3. Calcula o total financeiro (soma dos 12 meses)
      const financialTotal = ALL_MONTH_COLUMNS.reduce((sum, col) => {
        const monthValue = capexRecord[col as keyof typeof capexRecord] as Decimal | null;
        return sum + (monthValue ? monthValue.toNumber() : 0);
      }, 0);

      // 4. Calcula o total físico
      // ✅ CORRIGIDO: "physicalInputs" → "physicalinput"
      const physicalTotal = capexRecord.physicalinput.reduce((sum, input) => {
        return sum + input.jan.toNumber()
                   + input.fev.toNumber()
                   + input.mar.toNumber()
                   + input.abr.toNumber()
                   + input.mai.toNumber()
                   + input.jun.toNumber()
                   + input.jul.toNumber()
                   + input.ago.toNumber()
                   + input.set.toNumber()
                   + input.out.toNumber()
                   + input.nov.toNumber()
                   + input.dez.toNumber();
      }, 0);

      // 5. Determina o novo status físico
      let newStatus: PhysicalStatus = "PENDENTE";
      if (capexRecord.physicalinput.length > 0) {
        if (Math.abs(physicalTotal - financialTotal) < 0.01) {
          newStatus = "SIM";
        } else {
          newStatus = "NAO";
        }
      }

      // 6. Atualiza o status_fisico e retorna
      return tx.capexWeb.update({
        where: { capex: body.label! },
        data: { status_fisico: newStatus },
      });
    });

    return NextResponse.json(
      {
        success:      true,
        updatedCapex: result.capex,
        newStatus:    result.status_fisico,
      },
      { status: 200 }
    );
  } catch (e) {
    if (
      (e instanceof Error && e.message === "P2025") ||
      (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")
    ) {
      return NextResponse.json(
        { error: "CAPEX não encontrado para o label informado." },
        { status: 404 }
      );
    }
    console.error("PUT /api/capex/values erro:", e);
    return NextResponse.json(
      { error: "internal", details: e instanceof Error ? e.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
