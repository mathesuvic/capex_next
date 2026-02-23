// app/api/capex/getsummary/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type StatusCapex = 'PENDENTE' | 'FINALIZADO' | 'PARCIAL';
type StatusFisico = 'SIM' | 'NAO' | 'PENDENTE';

interface SubplanSummary {
  label: string;
  plano: string;
  meta: number;
  status_capex: StatusCapex;
  status_fisico: StatusFisico;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const subplans = await prisma.capexWeb.findMany({
      select: {
        // ✅ CORREÇÃO 1: O campo 'label' foi removido pois não existe no schema.prisma.
        capex: true,
        meta: true,
        status_capex: true,
        status_fisico: true,
      },
    });

    const summary = subplans.reduce(
      (acc, subplan) => {
        const metaValue = subplan.meta?.toNumber() || 0;

        acc.totalSubplans += 1;
        acc.totalMeta += metaValue;

        if (subplan.status_capex === 'FINALIZADO') {
          acc.capexFinalizadoCount += 1;
          acc.capexFinalizadoMeta += metaValue;
        } else if (subplan.status_capex === 'PARCIAL') {
          acc.capexParcialCount += 1;
          acc.capexParcialMeta += metaValue;
        } else {
          acc.capexPendenteCount += 1;
          acc.capexPendenteMeta += metaValue;
        }
        
        if (subplan.status_capex === 'FINALIZADO') {
            acc.totalFinalizadosParaFisico += 1;
            acc.totalMetaFinalizadosParaFisico += metaValue;
            if (subplan.status_fisico === 'SIM') {
                acc.fisicoSimCount += 1;
                acc.fisicoSimMeta += metaValue;
            } else if (subplan.status_fisico === 'NAO') {
                acc.fisicoNaoCount += 1;
                acc.fisicoNaoMeta += metaValue;
            } else {
                acc.fisicoPendenteCount += 1;
                acc.fisicoPendenteMeta += metaValue;
            }
        }

        return acc;
      },
      {
        totalSubplans: 0,
        totalMeta: 0,
        capexFinalizadoCount: 0,
        capexFinalizadoMeta: 0,
        capexParcialCount: 0,
        capexParcialMeta: 0,
        capexPendenteCount: 0,
        capexPendenteMeta: 0,
        totalFinalizadosParaFisico: 0,
        totalMetaFinalizadosParaFisico: 0,
        fisicoSimCount: 0,
        fisicoSimMeta: 0,
        fisicoNaoCount: 0,
        fisicoNaoMeta: 0,
        fisicoPendenteCount: 0,
        fisicoPendenteMeta: 0,
      }
    );

    const byPlan = subplans.reduce((acc, subplan) => {
        const planName = subplan.capex || "Sem Plano";
        if (!acc[planName]) {
            acc[planName] = { name: planName, totalMeta: 0, finalizadoMeta: 0, totalCount: 0, finalizadoCount: 0 };
        }
        const metaValue = subplan.meta?.toNumber() || 0;
        acc[planName].totalMeta += metaValue;
        acc[planName].totalCount += 1;
        if(subplan.status_capex === 'FINALIZADO') {
            acc[planName].finalizadoMeta += metaValue;
            acc[planName].finalizadoCount += 1;
        }
        return acc;
    }, {} as Record<string, {name: string, totalMeta: number, finalizadoMeta: number, totalCount: number, finalizadoCount: number}>);

    const subplanDetails: SubplanSummary[] = subplans.map(s => ({
        // ✅ CORREÇÃO 2: Usando 's.capex' para o label, pois 's.label' não existe.
        label: s.capex || 'N/A',
        plano: s.capex || 'N/A',
        meta: s.meta?.toNumber() || 0,
        status_capex: (s.status_capex as StatusCapex) || 'PENDENTE',
        status_fisico: (s.status_fisico as StatusFisico) || 'PENDENTE',
    }));

    return NextResponse.json({
      ok: true,
      updatedAt: new Date().toISOString(),
      summary,
      byPlan: Object.values(byPlan).sort((a,b) => b.totalMeta - a.totalMeta),
      subplanDetails
    });

  } catch (error) {
    console.error("[API GET SUMMARY ERROR]:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, error: "Erro interno do servidor.", details: errorMessage }, { status: 500 });
  }
}
