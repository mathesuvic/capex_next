// Em app/api/capex/route.ts

import { NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

/**
 * @description Busca todos os dados de CAPEX e anexa as transferências relacionadas de forma eficiente.
 */
export async function GET() {
  try {
    // 1. Busca os itens de CAPEX e todas as transferências em paralelo para maior performance.
    const [capexItems, allTransfers] = await Promise.all([
      db.capexWeb.findMany({
        orderBy: { ordem: 'asc' } // Garante uma ordem consistente.
      }),
      db.transfer.findMany({
        include: {
          from: { select: { capex: true } }, // Inclui o label de origem.
          to:   { select: { capex: true } },   // Inclui o label de destino.
        }
      })
    ]);

    // 2. Cria um índice de transferências (Map) para fazer a junção dos dados em memória, o que é muito mais rápido.
    const transfersByFromLabel = new Map<string, any[]>();
    for (const transfer of allTransfers) {
      const fromLabel = transfer.from.capex;
      if (!transfersByFromLabel.has(fromLabel)) {
        transfersByFromLabel.set(fromLabel, []);
      }
      // Adiciona a transferência formatada na lista correta.
      transfersByFromLabel.get(fromLabel)?.push({
        id: transfer.id,
        amount: Number(transfer.amount), // Converte o tipo Decimal do Prisma para Number.
        to: transfer.to.capex,
      });
    }

    // 3. Mapeia os dados do banco para o formato exato que o frontend precisa.
    const monthMapping: (keyof typeof capexItems[0])[] = [
      'jan_ano', 'fev_ano', 'mar_ano', 'abr_ano', 'mai_ano', 'jun_ano',
      'jul_ano', 'ago_ano', 'set_ano', 'out_ano', 'nov_ano', 'dez_ano'
    ];
    
    let planoCount = 0;
    const planoColors = ["bg-blue-50", "bg-green-50", "bg-yellow-50"];

    const finalData = capexItems.map((dbRow) => {
      const isSubLevel = dbRow.plano?.startsWith('sub');
      const isPlano = dbRow.plano === 'plano';
      
      const cells = monthMapping.map((key, index) => ({
        type: (index < 10) ? 'realizado' : 'previsto',
        // Converte o valor Decimal/null para Number, garantindo que não quebre o JSON.
        value: Number(dbRow[key]) || 0,
      }));

      // Monta o objeto final da linha.
      const row = {
        id: dbRow.id,
        label: dbRow.capex,
        sublevel: isSubLevel ? 1 : undefined,
        color: isPlano ? planoColors[planoCount++ % planoColors.length] : undefined,
        cells: cells,
        meta: Number(dbRow.meta) || 0,
        // Anexa a lista de transferências que já agrupamos. Se não houver, anexa um array vazio.
        transfers: transfersByFromLabel.get(dbRow.capex) || [],
      };
      
      return row;
    });
    
    return NextResponse.json(finalData, { status: 200 });

  } catch (e) {
    console.error('GET /api/capex erro:', e);
    const errorMessage = e instanceof Error ? e.message : 'Erro interno desconhecido';
    return NextResponse.json({ error: 'internal', details: errorMessage }, { status: 500 });
  }
}
