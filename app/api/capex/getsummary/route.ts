// app/api/capex/getsummary/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// --- Tipos de Status ---
type StatusCapex = 'PENDENTE' | 'FINALIZADO' | 'PARCIAL';
type StatusFisico = 'SIM' | 'NAO' | 'PENDENTE';

// --- Interfaces de Dados ---
interface SubplanSummary {
  label: string;
  // ✅ CORREÇÃO: O campo 'plano' representará o plano pai, que extrairemos do nome do subplano.
  plano: string;
  meta: number;
  status_capex: StatusCapex;
  status_fisico: StatusFisico;
}

interface PlanAggregation {
    name: string;
    totalMeta: number;
    finalizadoMeta: number;
    totalCount: number;
    finalizadoCount: number;
}

// Helper para extrair o nome do Plano (ex: "Plano 9 - Informática") do nome do subplano (ex: "9.1 - Subplano de TI")
function extractPlanName(subplanName: string | null): string {
    if (!subplanName) return "Plano não identificado";
    
    // Tenta encontrar um padrão como "Plano X -" ou "X.Y -"
    const match = subplanName.match(/^(Plano \d+ -|^\d+(\.\d+)? -)/);
    if (match) {
        const planPart = subplanName.split(' - ')[0];
        // Para casos como "9.1", pegamos apenas o "9"
        const mainPlanNumber = planPart.split('.')[0];
        // Busca um nome de plano mais completo (ex: "Plano 9 - Informática") se existir
        // Esta é uma lógica simplificada. O ideal seria ter uma coluna de 'plano pai' no banco.
        return `Plano ${mainPlanNumber}`;
    }
    return "Outros";
}


// Força a rota a ser dinâmica, garantindo que os dados sejam sempre recentes.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const subplans = await prisma.capexWeb.findMany({
      // ✅ CORREÇÃO PRINCIPAL: Filtra a busca para pegar apenas as linhas que são 'subplano'.
      where: {
        plano: 'subplano',
      },
      select: {
        capex: true,
        meta: true,
        status_capex: true,
        status_fisico: true,
      },
    });

    // --- 1. Cálculo dos Totais Gerais (para os cards) ---
    const summary = subplans.reduce(
      (acc, subplan) => {
        const metaValue = subplan.meta?.toNumber() || 0;

        acc.totalSubplans += 1;
        acc.totalMeta += metaValue;

        // Contabiliza por status financeiro
        switch (subplan.status_capex) {
          case 'FINALIZADO':
            acc.capexFinalizadoCount += 1;
            acc.capexFinalizadoMeta += metaValue;
            break;
          case 'PARCIAL':
            acc.capexParcialCount += 1;
            acc.capexParcialMeta += metaValue;
            break;
          default:
            acc.capexPendenteCount += 1;
            acc.capexPendenteMeta += metaValue;
            break;
        }
        
        // Contabiliza por status físico, mas apenas para os que já estão finalizados financeiramente
        if (subplan.status_capex === 'FINALIZADO') {
            acc.totalFinalizadosParaFisico += 1;
            acc.totalMetaFinalizadosParaFisico += metaValue;
            switch (subplan.status_fisico) {
              case 'SIM':
                acc.fisicoSimCount += 1;
                acc.fisicoSimMeta += metaValue;
                break;
              case 'NAO':
                acc.fisicoNaoCount += 1;
                acc.fisicoNaoMeta += metaValue;
                break;
              default:
                acc.fisicoPendenteCount += 1;
                acc.fisicoPendenteMeta += metaValue;
                break;
            }
        }
        return acc;
      },
      {
        totalSubplans: 0, totalMeta: 0, capexFinalizadoCount: 0, capexFinalizadoMeta: 0, capexParcialCount: 0,
        capexParcialMeta: 0, capexPendenteCount: 0, capexPendenteMeta: 0, totalFinalizadosParaFisico: 0,
        totalMetaFinalizadosParaFisico: 0, fisicoSimCount: 0, fisicoSimMeta: 0, fisicoNaoCount: 0, fisicoNaoMeta: 0,
        fisicoPendenteCount: 0, fisicoPendenteMeta: 0,
      }
    );

    // --- 2. Agrupamento por Plano de Investimento (para o gráfico de barras) ---
    const byPlan = subplans.reduce((acc, subplan) => {
        // ✅ MELHORIA: A lógica agora tenta agrupar por um plano "pai".
        const planName = extractPlanName(subplan.capex);
        
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
    }, {} as Record<string, PlanAggregation>);

    // --- 3. Formatação dos Detalhes (para a tabela) ---
    const subplanDetails: SubplanSummary[] = subplans.map(s => ({
        label: s.capex || 'N/A',
        plano: extractPlanName(s.capex), // Usando a mesma lógica para consistência
        meta: s.meta?.toNumber() || 0,
        status_capex: (s.status_capex as StatusCapex) || 'PENDENTE',
        status_fisico: (s.status_fisico as StatusFisico) || 'PENDENTE',
    }));

    // --- 4. Envio da Resposta ---
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
