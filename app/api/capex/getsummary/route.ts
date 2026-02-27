// app/api/capex/getsummary/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// --- Tipos de Status ---
type StatusCapex = 'PENDENTE' | 'FINALIZADO' | 'PARCIAL';
type StatusFisico = 'SIM' | 'NAO' | 'PENDENTE';

// Força a rota a ser dinâmica, garantindo que os dados sejam sempre recentes do banco.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // --- Passo 1: Busca de Dados no Banco (Em Paralelo) ---
    const [subplans, planDescriptions] = await Promise.all([
      // Busca somente as linhas que são 'subplano' na tabela principal.
      prisma.capexWeb.findMany({
        where: { plano: 'subplano' },
        select: {
          capex: true,
          meta: true,
          status_capex: true,
          status_fisico: true,
        },
      }),
      // Busca a tabela de-para que contém toda a hierarquia.
      prisma.planosDesc.findMany({
        select: {
          plano_investimento: true, // A chave de ligação (ex: 1.1.1 - Subestações)
          tipo: true,               // ✅ CORRIGIDO: Estava 'tpo', o correto é 'tipo'
          natureza: true,           // Nível 2 (Natureza)
          plano_text: true,         // Nível 3 (Plano)
        }
      })
    ]);

    // --- Passo 2: Mapeamento da Hierarquia ---
    // Criamos um mapa para cruzar os dados rapidamente sem sobrecarregar o servidor
    const descMap = new Map();
    planDescriptions.forEach(desc => {
      if (desc.plano_investimento) {
        descMap.set(desc.plano_investimento, desc);
      }
    });

    // --- Passo 3: Criação dos Dados Brutos (Raw Data) ---
    // Em vez de agrupar aqui, nós enviamos os dados completos (enriquecidos) para o frontend.
    // O frontend vai usar isso para permitir o clique nos gráficos (Drill-down).
    const rawData = subplans.map(subplan => {
      // Pega as informações de hierarquia correspondentes àquele subplano
      const desc = descMap.get(subplan.capex) || {};
      
      return {
        id: subplan.capex || 'Desconhecido', // Identificador único
        meta: subplan.meta?.toNumber() || 0,
        status_capex: (subplan.status_capex as StatusCapex) || 'PENDENTE',
        status_fisico: (subplan.status_fisico as StatusFisico) || 'PENDENTE',
        
        // --- COLUNAS DE HIERARQUIA PARA O DRILL-DOWN ---
        // Se vier vazio do banco, classificamos como "Outros" para não quebrar o gráfico
        tipo: desc.tipo || 'Outros', // ✅ CORRIGIDO: Estava 'desc.tpo'
        natureza: desc.natureza || 'Outros',
        plano_text: desc.plano_text || 'Outros',
        plano_investimento: subplan.capex || 'Outros' // O capex é o próprio nível mais baixo
      };
    });

    // --- Passo 4: Envio da Resposta ---
    return NextResponse.json({
      ok: true,
      updatedAt: new Date().toISOString(),
      rawData // Enviamos apenas a lista de dados enriquecida
    });

  } catch (error) {
    console.error("[API GET SUMMARY ERROR]:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, error: "Erro interno do servidor ao processar dados.", details: errorMessage }, { status: 500 });
  }
}
