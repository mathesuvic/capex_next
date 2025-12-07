import { NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function GET() {
  try {
    const rawDataFromDb = await db.capexWeb.findMany();

    // Usaremos um array simples, pois a ordem do banco de dados já é a correta
    const finalData = [];

    const monthMapping = [
      { key: 'jan_ano', month: 1 }, { key: 'fev_ano', month: 2 },
      { key: 'mar_ano', month: 3 }, { key: 'abr_ano', month: 4 },
      { key: 'mai_ano', month: 5 }, { key: 'jun_ano', month: 6 },
      { key: 'jul_ano', month: 7 }, { key: 'ago_ano', month: 8 },
      { key: 'set_ano', month: 9 }, { key: 'out_ano', month: 10 },
      { key: 'nov_ano', month: 11 }, { key: 'dez_ano', month: 12 },
    ];

    let planoCount = 0;
    const planoColors = ["bg-blue-50", "bg-green-50", "bg-yellow-50"];

    // Itera sobre cada linha do banco de dados
    for (const [index, dbRow] of rawDataFromDb.entries()) {
      
      const isSubLevel = dbRow.plano === 'sub' || dbRow.plano === 'subplano';
      const isPlano = dbRow.plano === 'plano';

      // Monta a estrutura de Células (cells)
      const cells = [];
      for (const month of monthMapping) {
        const key = month.key as keyof typeof dbRow;
        const value = dbRow[key];

        cells.push({
          // LÓGICA CORRIGIDA: Define o tipo baseado no mês
          type: month.month <= 10 ? 'realizado' : 'previsto',
          // Garante que o valor é um número ou 0 se for nulo
          value: Number(value) || 0,
        });
      }

      // Monta a estrutura da Linha (RowData) completa
      const row = {
        // ADICIONADO: 'id' é crucial para as funções de edição. Usamos o índice como fallback.
        id: index, 
        label: dbRow.capex,
        // CORRIGIDO: sublevel para bater com a lógica do componente
        sublevel: isSubLevel ? 1 : undefined,
        // ADICIONADO: 'color' para os planos principais
        color: isPlano ? planoColors[planoCount++ % planoColors.length] : undefined,
        cells: cells,
        // ADICIONADO: Campos que o componente espera, mesmo que com valores padrão
        meta: 0, 
        transfers: [], 
      };

      finalData.push(row);
    }
    
    return NextResponse.json(finalData, { status: 200 });

  } catch (e) {
    console.error('GET /api/capex erro:', e);
    const errorMessage = e instanceof Error ? e.message : 'Erro interno desconhecido';
    return NextResponse.json({ error: 'internal', details: errorMessage }, { status: 500 });
  }
}
