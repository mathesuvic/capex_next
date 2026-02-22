// app/api/capex/route.ts

import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { PhysicalStatus } from "@prisma/client"; // <<< ADICIONADO AQUI

export const runtime = "nodejs";
// opcional para evitar cache em dev:
// export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const purpose = url.searchParams.get("purpose");

    const whereClause: { plano?: string } = {};

    if (purpose === "dropdown") {
      whereClause.plano = "subplano";
    }

    const [capexItems, allTransfers] = await Promise.all([
      prisma.capexWeb.findMany({
        where: whereClause,
        orderBy: [{ ordem: "asc" }],
      }),
      prisma.transfer.findMany({
        include: {
          from: { select: { capex: true } },
          to: { select: { capex: true } },
        },
      }),
    ]);

    const toNum = (v: unknown) => (v == null ? 0 : Number(v));

    const transfersByFrom = new Map<
      string,
      Array<{ id: number; amount: number; to: string }>
    >();

    for (const t of allTransfers) {
      const fromLabel = t.from?.capex;
      const toLabel = t.to?.capex;
      if (!fromLabel || !toLabel) continue;

      if (!transfersByFrom.has(fromLabel)) transfersByFrom.set(fromLabel, []);
      transfersByFrom.get(fromLabel)!.push({
        id: t.id,
        amount: toNum(t.amount),
        to: toLabel,
      });
    }

    const monthMapping = [
      "jan_ano", "fev_ano", "mar_ano", "abr_ano", "mai_ano", "jun_ano",
      "jul_ano", "ago_ano", "set_ano", "out_ano", "nov_ano", "dez_ano",
    ] as const;

    let planoCount = 0;
    const planoColors = ["bg-blue-50", "bg-green-50", "bg-yellow-50"] as const;

    const finalData = capexItems.map((row) => {
      const isSubLevel = row.plano?.startsWith("sub");
      const isPlano = row.plano === "plano";

      const cells = monthMapping.map((key, idx) => ({
        type: idx < 10 ? "realizado" : "previsto",
        value: toNum((row as any)[key]),
      }));

      return {
        id: row.capex,
        label: row.capex,
        capex: row.capex,
        sublevel: isSubLevel ? 1 : undefined,
        color: isPlano ? planoColors[planoCount++ % planoColors.length] : undefined,
        cells,
        meta: toNum((row as any).meta),
        transfers: transfersByFrom.get(row.capex) ?? [],
        status_capex: row.status_capex,
        // ✅ ✅ ✅ ESTA É A ÚNICA LINHA QUE ESTAMOS ADICIONANDO ✅ ✅ ✅
        status_fisico: row.status_fisico as PhysicalStatus, 
      };
    });

    return NextResponse.json(finalData, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/capex erro:", e);
    return NextResponse.json(
      { error: "internal", details: e?.message ?? "Erro interno desconhecido" },
      { status: 500 }
    );
  }
}
