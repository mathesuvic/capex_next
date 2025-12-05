"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"

interface CellData {
  value: number | string
  type: "realizado" | "previsto"
}

interface RowData {
  label: string
  sublevel?: number
  color?: string
  cells: CellData[]
  computed?: boolean
  meta?: number // <- meta anual pré-definida por linha
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

// Exemplo com metas pré-definidas nos subníveis.
// As metas dos “Planos” serão somadas automaticamente.
const initialData: RowData[] = [
  {
    label: "Plano 1 - Expansão de Rede",
    color: "bg-blue-50",
    cells: [
      { value: 41192, type: "realizado" },
      { value: 61320, type: "realizado" },
      { value: 79033, type: "realizado" },
      { value: 79414, type: "realizado" },
      { value: 90391, type: "realizado" },
      { value: 97244, type: "realizado" },
      { value: 63700, type: "realizado" },
      { value: 81745, type: "realizado" },
      { value: 97633, type: "realizado" },
      { value: 127582, type: "realizado" },
      { value: 105648, type: "realizado" },
      { value: 88102, type: "realizado" },
    ],
  },
  {
    label: "1.1 - Subestações",
    sublevel: 1,
    meta: 350000, // exemplo de meta anual
    cells: [
      { value: 8817, type: "realizado" },
      { value: 12242, type: "realizado" },
      { value: 19116, type: "realizado" },
      { value: 27885, type: "realizado" },
      { value: 30912, type: "realizado" },
      { value: 28967, type: "realizado" },
      { value: 19033, type: "realizado" },
      { value: 25259, type: "realizado" },
      { value: 19444, type: "realizado" },
      { value: 25023, type: "realizado" },
      { value: 37235, type: "previsto" },
      { value: 41286, type: "previsto" },
    ],
  },
  {
    label: "1.2 - Linhas de Transmissão",
    sublevel: 1,
    meta: 600000,
    cells: [
      { value: 29685, type: "realizado" },
      { value: 39691, type: "realizado" },
      { value: 53583, type: "realizado" },
      { value: 44947, type: "realizado" },
      { value: 52267, type: "realizado" },
      { value: 57185, type: "realizado" },
      { value: 37689, type: "realizado" },
      { value: 59108, type: "realizado" },
      { value: 58571, type: "realizado" },
      { value: 89033, type: "realizado" },
      { value: 53883, type: "previsto" },
      { value: 28637, type: "previsto" },
    ],
  },
  {
    label: "1.3 - Distribuição",
    sublevel: 1,
    meta: 120000,
    cells: [
      { value: 2690, type: "realizado" },
      { value: 9386, type: "realizado" },
      { value: 6335, type: "realizado" },
      { value: 6295, type: "realizado" },
      { value: 7212, type: "realizado" },
      { value: 11112, type: "realizado" },
      { value: 6978, type: "realizado" },
      { value: 10047, type: "realizado" },
      { value: 19618, type: "realizado" },
      { value: 12920, type: "realizado" },
      { value: 14529, type: "previsto" },
      { value: 18176, type: "previsto" },
    ],
  },
  {
    label: "Plano 2 - Projetos Especiais",
    color: "bg-green-50",
    cells: [
      { value: 0, type: "realizado" },
      { value: 356, type: "realizado" },
      { value: 8869, type: "realizado" },
      { value: 413, type: "realizado" },
      { value: 1021, type: "realizado" },
      { value: 911, type: "realizado" },
      { value: 1394, type: "realizado" },
      { value: 787, type: "realizado" },
      { value: 1285, type: "realizado" },
      { value: 359, type: "realizado" },
      { value: 9935, type: "previsto" },
      { value: 8897, type: "previsto" },
    ],
  },
  {
    label: "2.1 - Projeto Sistema Técnico BRR",
    sublevel: 1,
    meta: 0,
    cells: Array.from({ length: 12 }, () => ({ value: 0, type: "realizado" })),
  },
  {
    label: "2.2 - Projeto Operação EMS",
    sublevel: 1,
    meta: 800, // exemplo
    cells: [
      { value: 22, type: "realizado" },
      { value: 30, type: "realizado" },
      { value: 27, type: "realizado" },
      { value: 28, type: "realizado" },
      { value: 15, type: "realizado" },
      { value: 23, type: "realizado" },
      { value: 25, type: "realizado" },
      { value: 30, type: "realizado" },
      { value: 48, type: "realizado" },
      { value: 38, type: "realizado" },
      { value: 29, type: "previsto" },
      { value: 62, type: "previsto" },
    ],
  },
  {
    label: "2.3 - Cybersecurity",
    sublevel: 1,
    meta: 20000,
    cells: [
      { value: 581, type: "realizado" },
      { value: 0, type: "realizado" },
      { value: 889, type: "realizado" },
      { value: 41, type: "realizado" },
      { value: 549, type: "realizado" },
      { value: 704, type: "realizado" },
      { value: 1177, type: "realizado" },
      { value: 572, type: "realizado" },
      { value: 890, type: "realizado" },
      { value: 11, type: "realizado" },
      { value: 9906, type: "previsto" },
      { value: 8835, type: "previsto" },
    ],
  },
]

// Soma subníveis para formar as linhas “Plano” e agrega meta
function computeAggregates(rows: RowData[]): RowData[] {
  const result = rows.map((r) => ({ ...r, cells: r.cells.map((c) => ({ ...c })) }))

  let i = 0
  while (i < result.length) {
    const row = result[i]
    if (row.sublevel === undefined) {
      const agg = Array(12).fill(0)
      let metaSum = 0

      let j = i + 1
      while (j < result.length && result[j].sublevel === 1) {
        result[j].cells.forEach((cell, idx) => {
          const val = typeof cell.value === "number" ? cell.value : 0
          agg[idx] += val
        })
        metaSum += result[j].meta ?? 0
        j++
      }

      result[i] = {
        ...row,
        computed: true,
        meta: metaSum,
        cells: agg.map((v, idx) => ({
          value: v,
          type: idx < 10 ? "realizado" : "previsto",
        })),
      }

      i = j
    } else {
      i++
    }
  }

  return result
}

export function CapexTable() {
  const [data, setData] = useState(initialData)

  const handleCellChange = (rowIndex: number, cellIndex: number, value: string) => {
    const newData = [...data]
    const numValue = value === "" ? 0 : Number.parseFloat(value) || 0
    newData[rowIndex].cells[cellIndex].value = numValue
    setData(newData)
  }

  const calculateTotal = (rowCells: CellData[]) => {
    return rowCells.reduce((sum, cell) => {
      const val = typeof cell.value === "number" ? cell.value : 0
      return sum + val
    }, 0)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: 0,
    }).format(num)
  }

  const displayData = computeAggregates(data)

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#00823B] text-white">
              <th className="sticky left-0 z-20 bg-[#00823B] border border-[#004d23] px-4 py-3 text-left font-semibold min-w-64">
                CAPEX (R$ Mil)
              </th>
              {MONTHS.map((month, idx) => (
                <th key={idx} className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-32 text-sm">
                  {month}/25
                </th>
              ))}
              <th className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-40 bg-[#FFB81C] text-slate-900 font-bold">
                MELHOR VISÃO
              </th>
              <th className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-40 bg-slate-100 text-slate-900 font-bold">
                META
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, rowIndex) => {
              const total = calculateTotal(row.cells)
              const isSubLevel = row.sublevel !== undefined

              return (
                <tr
                  key={rowIndex}
                  className={`${row.color || (isSubLevel ? "bg-white" : "bg-slate-50")} border-b border-slate-200 hover:bg-slate-50 transition-colors`}
                >
                  <td
                    className={`sticky left-0 z-10 border border-slate-200 px-4 py-3 font-medium ${
                      row.color || (isSubLevel ? "bg-white" : "bg-slate-50")
                    } ${isSubLevel ? "pl-8 text-slate-700" : "text-slate-900"}`}
                  >
                    {row.label}
                  </td>

                  {row.cells.map((cell, cellIndex) => {
                    const isRealizado = cellIndex >= 0 && cellIndex <= 9
                    const isEditable = row.sublevel === 1 && (cellIndex === 10 || cellIndex === 11)

                    return (
                      <td
                        key={cellIndex}
                        className={`border border-slate-200 px-3 py-3 text-center min-w-32 ${
                          isRealizado ? "bg-[#e6f0ff] text-slate-900" : "bg-white"
                        }`}
                      >
                        {isEditable ? (
                          <input
                            type="number"
                            value={cell.value === 0 ? "" : cell.value}
                            onChange={(e) => handleCellChange(rowIndex, cellIndex, e.target.value)}
                            className="w-full bg-[#e6f7f0] border border-[#00823B] rounded px-2 py-1 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00823B] focus:bg-white"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-sm font-medium text-slate-700">
                            {formatNumber(typeof cell.value === "number" ? cell.value : 0)}
                          </span>
                        )}
                      </td>
                    )
                  })}

                  <td className="border border-slate-200 px-3 py-3 text-center font-bold text-slate-900 bg-[#fff3e0] min-w-40">
                    <span className="text-sm">{formatNumber(total)}</span>
                  </td>
                  <td className="border border-slate-200 px-3 py-3 text-center font-bold text-slate-900 bg-slate-100 min-w-40">
                    <span className="text-sm">{formatNumber(row.meta ?? 0)}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
        <p className="text-sm text-slate-600">
          <span className="inline-block w-3 h-3 bg-[#e6f0ff] border border-[#0066CC] rounded mr-2"></span>
          Valores em <strong>azul</strong> são dados de janeiro a outubro (imutáveis)
        </p>
        <p className="text-sm text-slate-600 mt-2">
          <span className="inline-block w-3 h-3 bg-[#e6f7f0] border border-[#00823B] rounded mr-2"></span>
          Valores em <strong>verde</strong> são novembro e dezembro (editáveis nos subníveis)
        </p>
        <p className="text-sm text-slate-600 mt-2">
          <span className="inline-block w-3 h-3 bg-[#fff3e0] border border-[#FFB81C] rounded mr-2"></span>
          <strong>Melhor Visão</strong> é o somatório de todos os 12 meses
        </p>
      </div>
    </Card>
  )
}
