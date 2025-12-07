"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"

// --- Interfaces ---
interface CellData {
  value: number | string
  type: "realizado" | "previsto"
}

interface TransferEntry {
  id?: number
  amount: number
  to?: string
  toId?: number
}

interface RowData {
  id?: number
  label: string
  sublevel?: number
  color?: string
  cells: CellData[]
  computed?: boolean
  meta?: number
  transfers?: TransferEntry[]
  transferNet?: number
}

// --- Constantes ---
const MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]

// --- Funções Helper ---
function calculateTotal(rowCells: CellData[]) {
  return rowCells.reduce((sum, c) => sum + (typeof c.value === "number" ? c.value : 0), 0)
}
const formatNumber = (num: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(num)
const formatSigned = (n: number) => `${n > 0 ? "+" : ""}${formatNumber(n)}`

const sumOutgoing = (row: RowData) =>
  (row.transfers ?? []).reduce((s, t) => s + (Number.isFinite(t.amount) ? t.amount : 0), 0)

function buildIncomingIndex(rows: RowData[]) {
  const sublabels = new Set(rows.filter(r => r.sublevel === 1).map(r => r.label))
  const temp: Record<string, Record<string, number>> = {}
  rows.forEach((r) => {
    (r.transfers ?? []).forEach((t) => {
      if (!t?.to || !Number.isFinite(t.amount)) return
      if (!sublabels.has(t.to)) return
      temp[t.to] = temp[t.to] || {}
      temp[t.to][r.label] = (temp[t.to][r.label] || 0) + t.amount
    })
  })
  const result: Record<string, { from: string; amount: number }[]> = {}
  Object.entries(temp).forEach(([dest, byFrom]) => {
    result[dest] = Object.entries(byFrom).map(([from, amount]) => ({ from, amount }))
  })
  return result
}

function computeDisplay(rows: RowData[]): RowData[] {
  const res = structuredClone(rows);
  const subIndex = new Map<string, number>()
  res.forEach((r, i) => { if (r.sublevel === 1) subIndex.set(r.label, i) })
  const outgoing = res.map(sumOutgoing)
  const incoming = Array(res.length).fill(0)
  res.forEach((r) => {
    (r.transfers ?? []).forEach(t => {
      if (!t?.to) return
      const idx = subIndex.get(t.to)
      if (idx !== undefined && Number.isFinite(t.amount)) incoming[idx] += t.amount
    })
  })
  const net = res.map((_, i) => incoming[i] - outgoing[i])

  let i = 0
  while (i < res.length) {
    const row = res[i]
    if (row.sublevel === undefined) {
      const agg = Array(12).fill(0)
      let metaSum = 0
      let netSum = 0
      let j = i + 1
      while (j < res.length && res[j].sublevel === 1) {
        res[j].cells.forEach((cell, idx) => {
          agg[idx] += typeof cell.value === "number" ? cell.value : 0
        })
        metaSum += res[j].meta ?? 0
        netSum += net[j]
        res[j] = { ...res[j], transferNet: net[j] }
        j++
      }
      res[i] = {
        ...row, computed: true, meta: metaSum, transferNet: netSum,
        cells: agg.map((v, idx) => ({ value: v, type: idx < 10 ? "realizado" : "previsto" })),
      }
      i = j
    } else {
      if(res[i].transferNet === undefined){
        res[i] = { ...res[i], transferNet: net[i] };
      }
      i++;
    }
  }
  return res
}

export function CapexTable() {
  const [data, setData] = useState<RowData[]>([])
  const [mapOpen, setMapOpen] = useState(false)
  const [openDetails, setOpenDetails] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/capex", { cache: "no-store" })
        if (!res.ok) throw new Error("Falha ao buscar /api/capex")
        const json = await res.json()
        if (!cancelled) setData(json as RowData[])
      } catch (e) {
        console.error(e)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const displayData = useMemo(() => computeDisplay(data), [data]);
  const subplans = useMemo(
    () => data.filter(r => r.sublevel === 1).map(r => ({ label: r.label, id: r.id })),
    [data]
  )
  const sublevelOptions = subplans.map(s => s.label)
  const incomingIndex = useMemo(() => buildIncomingIndex(data), [data]);
  
  const handleCellChange = async (row: RowData, rowIndex: number, cellIndex: number, value: string) => {
    const numValue = value === "" ? 0 : Number.parseFloat(value) || 0;
    setData(prev => {
      const copy = structuredClone(prev) as RowData[];
      const originalIndex = prev.findIndex(item => item.label === row.label);
      if (originalIndex !== -1) {
          copy[originalIndex].cells[cellIndex].value = numValue;
      }
      return copy;
    });
    if (row.sublevel === 1 && (cellIndex === 10 || cellIndex === 11)) {
      try {
        const month = cellIndex + 1;
        await fetch(`/api/capex/values`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month, value: numValue, label: row.label }),
        });
      } catch (e) { console.error(e); }
    }
  };

  const addTransfer = async (rowIndex: number) => {
    const originalRow = displayData[rowIndex];
    if (!originalRow?.label) return;
    const dest = subplans.find(s => s.label && s.label !== originalRow.label) || subplans[0];
    if (!dest?.label) return;
    try {
      const res = await fetch(`/api/capex/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromLabel: originalRow.label, toLabel: dest.label, amount: 0 }),
      });
      if (!res.ok) throw new Error('Falha ao criar transferência na API');
      const newTransfer = await res.json();
      setData(prev => {
        const copy = structuredClone(prev) as RowData[];
        const originalIndex = copy.findIndex(item => item.label === originalRow.label);
        if (originalIndex !== -1) {
          const currentTransfers = copy[originalIndex].transfers ?? [];
          copy[originalIndex].transfers = [...currentTransfers, {
            id: newTransfer.id,
            amount: newTransfer.amount,
            to: dest.label,
          }];
        }
        return copy;
      });
    } catch (e) { console.error("Erro ao adicionar transferência:", e); }
  };

  const updateTransferAmount = async (rowIndex: number, tIndex: number, value: string) => {
    const amount = value === "" ? 0 : Number.parseFloat(value) || 0;
    const rowLabel = displayData[rowIndex].label;
    setData(prev => {
      const copy = structuredClone(prev) as RowData[];
      const originalIndex = copy.findIndex(item => item.label === rowLabel);
      if (originalIndex !== -1) {
        const list = [...(copy[originalIndex].transfers ?? [])];
        list[tIndex] = { ...list[tIndex], amount };
        copy[originalIndex].transfers = list;
      }
      return copy;
    });
    const transferToUpdate = data.find(r => r.label === rowLabel)?.transfers?.[tIndex];
    if (!transferToUpdate?.id) return;
    try {
      await fetch(`/api/capex/transfers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: transferToUpdate.id, amount, toLabel: transferToUpdate.to }),
      });
    } catch (e) { console.error("Erro ao atualizar valor da transferência:", e); }
  };

  const updateTransferTarget = async (rowIndex: number, tIndex: number, toLabel: string) => {
    const rowLabel = displayData[rowIndex].label;
    const dest = data.find(r => r.sublevel === 1 && r.label === toLabel);
    setData(prev => {
      const copy = structuredClone(prev) as RowData[];
      const originalIndex = copy.findIndex(item => item.label === rowLabel);
      if(originalIndex !== -1) {
        const list = [...(copy[originalIndex].transfers ?? [])];
        list[tIndex] = { ...list[tIndex], to: toLabel, toId: dest?.id };
        copy[originalIndex].transfers = list;
      }
      return copy;
    });
    const transferToUpdate = data.find(r => r.label === rowLabel)?.transfers?.[tIndex];
    if (!transferToUpdate?.id) return;
    try {
      await fetch(`/api/capex/transfers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: transferToUpdate.id, amount: transferToUpdate.amount, toLabel }),
      });
    } catch (e) { console.error("Erro ao atualizar destino da transferência:", e); }
  };

  const removeTransfer = async (rowIndex: number, tIndex: number) => {
    const rowLabel = displayData[rowIndex].label;
    const transferToRemove = data.find(r => r.label === rowLabel)?.transfers?.[tIndex];
    if (!transferToRemove?.id) {
      setData(prev => {
        const copy = structuredClone(prev) as RowData[];
        const originalIndex = copy.findIndex(item => item.label === rowLabel);
        if(originalIndex !== -1){
            const list = [...(copy[originalIndex].transfers ?? [])];
            list.splice(tIndex, 1);
            copy[originalIndex].transfers = list;
        }
        return copy;
      });
      return;
    }
    try {
      const res = await fetch(`/api/capex/transfers?id=${transferToRemove.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao deletar transferência na API');
      setData(prev => {
         const copy = structuredClone(prev) as RowData[];
         const originalIndex = copy.findIndex(item => item.label === rowLabel);
         if(originalIndex !== -1){
             const list = [...(copy[originalIndex].transfers ?? [])];
             list.splice(tIndex, 1);
             copy[originalIndex].transfers = list;
         }
         return copy;
      });
    } catch (e) { console.error("Erro ao remover transferência:", e); }
  };

  const loading = data.length === 0;

  return (
    <>
      <Card className="overflow-hidden border border-slate-200 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <h3 className="text-sm font-semibold text-slate-800">CAPEX (R$ Mil)</h3>
          <button
            onClick={() => setMapOpen(true)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1.5"
            disabled={loading}
          >
            Mapa de Transferências
          </button>
        </div>
        {loading ? (
        <div className="p-6 text-sm text-slate-600">Carregando...</div>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#00823B] text-white">
                            <th className="sticky left-0 z-20 bg-[#00823B] border-r border-b border-[#004d23] px-4 py-3 text-left font-semibold min-w-64">
                            CAPEX (R$ Mil)
                            </th>
                            {MONTHS.map((m, idx) => (
                            <th key={idx} className="border-b border-r border-[#004d23] px-3 py-3 text-center font-semibold min-w-32 text-sm">
                                {m}/25
                            </th>
                            ))}
                            <th className="border-b border-r border-slate-500 px-3 py-3 text-center font-semibold min-w-40 bg-amber-300 text-slate-900 font-bold">
                            MELHOR VISÃO
                            </th>
                            <th className="border-b border-r border-slate-500 px-3 py-3 text-center font-semibold min-w-40 bg-sky-300 text-slate-900 font-bold">
                            META
                            </th>
                            <th className="border-b border-r border-slate-500 px-3 py-3 text-center font-semibold min-w-56 bg-violet-300 text-slate-900 font-bold">
                            TRANSFERÊNCIA (líquida)
                            </th>
                            <th className="border-b border-slate-500 px-3 py-3 text-center font-semibold min-w-48 bg-slate-300 text-slate-900 font-bold">
                            SALDO A DISTRIBUIR
                            </th>
                        </tr>
                    </thead>
                    <tbody>
              {displayData.map((row, rowIndex) => {
                const total = calculateTotal(row.cells)
                const isSubLevel = row.sublevel === 1
                const isPlano = row.sublevel === undefined
                const net = row.transferNet ?? 0
                const metaVal = row.meta ?? 0
                const saldo = metaVal - total + net 
                const incomingList = incomingIndex[row.label] ?? []
                const originalRowData = data.find(d => d.label === row.label);
                const outgoingList = originalRowData?.transfers ?? [];
                const incomingCount = incomingList.length
                const outgoingCount = outgoingList.length
                const isDetailsOpen = openDetails === rowIndex;

                return (
                  <tr
                    key={rowIndex}
                    className={`${row.color || (isSubLevel ? "bg-white" : "bg-slate-50")} border-b border-slate-200 hover:bg-slate-50 transition-colors ${isDetailsOpen ? 'relative z-10' : ''}`}
                  >
                    <td
                      className={`sticky left-0 z-10 border-r border-slate-200 px-4 py-3 font-medium ${
                        row.color || (isSubLevel ? "bg-white" : "bg-slate-50")
                      } ${isSubLevel ? "pl-8 text-slate-700" : "text-slate-900"}`}
                    >
                      {row.label}
                    </td>

                    {row.cells.map((cell, cellIndex) => {
                      const isRealizado = cellIndex < 10
                      const isEditable = isSubLevel && (cellIndex === 10 || cellIndex === 11)
                      return (
                        <td
                          key={cellIndex}
                          className={`border-r border-slate-200 px-3 py-3 text-center min-w-32 ${
                            isRealizado ? "bg-blue-50/50" : "bg-white"
                          }`}
                        >
                          {isEditable ? (
                            <input
                              type="number"
                              value={cell.value === 0 ? "" : cell.value}
                              onChange={(e) => handleCellChange(row, rowIndex, cellIndex, e.target.value)}
                              className="w-full bg-emerald-50/50 border border-emerald-500 rounded px-2 py-1 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
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

                    <td className="border-r border-slate-200 px-3 py-3 text-center font-bold text-slate-900 bg-amber-50 min-w-40">
                      <span className="text-sm">{formatNumber(total)}</span>
                    </td>
                    <td className="border-r border-slate-200 px-3 py-3 text-center font-bold text-slate-900 bg-sky-50 min-w-40">
                      <span className="text-sm">{formatNumber(metaVal)}</span>
                    </td>

                    <td className="border-r border-slate-200 px-3 py-3 text-center bg-violet-50 min-w-56">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span
                          className={`text-sm font-bold ${
                            net > 0 ? "text-emerald-700" : net < 0 ? "text-red-700" : "text-slate-900"
                          }`}
                        >
                          {formatSigned(net)}
                        </span>
                        {isSubLevel && (
                          <span className="text-[11px] text-slate-600">
                            Entradas: <span className="text-emerald-700 font-medium">+{incomingCount}</span> | Saídas: <span className="text-red-700 font-medium">{outgoingCount}</span>
                          </span>
                        )}
                        {isSubLevel && (
                          <div className="relative mt-1">
                            <button onClick={() => setOpenDetails(isDetailsOpen ? null : rowIndex)} className="cursor-pointer text-xs text-indigo-700 underline decoration-dotted select-none">
                              detalhes
                            </button>
                            {isDetailsOpen && (
                              <div className="absolute right-0 mt-2 w-[520px] bg-white border border-slate-200 rounded shadow-lg p-3 z-20 text-left">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-xs font-semibold text-emerald-700 mb-2">Entradas (por origem)</h4>
                                    <div className="max-h-56 overflow-auto space-y-2">
                                      {incomingList.length > 0 ? (
                                        incomingList.map((inc, idx) => (
                                          <div key={idx} className="flex items-center justify-between border border-emerald-100 rounded px-2 py-1">
                                            <span className="text-xs text-slate-700">{inc.from}</span>
                                            <span className="text-xs font-semibold text-emerald-700">+{formatNumber(inc.amount)}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-xs text-slate-500">Sem entradas.</p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-semibold text-red-700 mb-2">Saídas</h4>
                                    <div className="max-h-56 overflow-auto space-y-2">
                                      {outgoingList.map((t, tIdx) => (
                                        <div key={tIdx} className="grid grid-cols-12 gap-2 items-end">
                                          <div className="col-span-5">
                                            <label className="text-[11px] text-slate-500">Valor (saída)</label>
                                            <input
                                              type="number"
                                              value={t.amount === 0 ? "" : t.amount}
                                              onChange={(e) => updateTransferAmount(rowIndex, tIdx, e.target.value)}
                                              className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                                              placeholder="0"
                                            />
                                          </div>
                                          <div className="col-span-6">
                                            <label className="text-[11px] text-slate-500">Destino (subplano)</label>
                                            <select
                                              value={t.to ?? ""}
                                              onChange={(e) => updateTransferTarget(rowIndex, tIdx, e.target.value)}
                                              className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                                            >
                                              <option value="" disabled>Selecione um subplano</option>
                                              {sublevelOptions.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="col-span-1">
                                            <button
                                              onClick={() => removeTransfer(rowIndex, tIdx)}
                                              className="text-xs text-red-600 hover:underline"
                                            >
                                              x
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                      {outgoingList.length === 0 && (
                                        <p className="text-xs text-slate-500">Sem saídas.</p>
                                      )}
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                      <span className="text-xs text-slate-700">
                                        Total saídas: <span className="font-semibold text-red-700">
                                          {formatNumber(outgoingList.reduce((s, t) => s + (t.amount || 0), 0))}
                                        </span>
                                      </span>
                                      <button
                                        onClick={() => addTransfer(rowIndex)}
                                        className="bg-indigo-600 text-white text-xs rounded px-2 py-1 hover:bg-indigo-700"
                                      >
                                        Adicionar saída
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 text-xs text-slate-700 border-t pt-2">
                                  Líquido (entradas − saídas):{" "}
                                  <span className={`font-semibold ${net > 0 ? "text-emerald-700" : net < 0 ? "text-red-700" : "text-slate-900"}`}>
                                    {formatSigned(net)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {isPlano && (
                          <p className="mt-1 text-[11px] text-slate-500">
                            Soma das transferências líquidas dos subplanos.
                          </p>
                        )}
                      </div>
                    </td>

                    <td className={`px-3 py-3 text-center min-w-48 ${
                      saldo > 0 ? "bg-emerald-50" : saldo < 0 ? "bg-rose-50" : "bg-white"
                    }`}>
                      <span
                        className={`text-sm font-bold ${
                          saldo > 0 ? "text-emerald-700" : saldo < 0 ? "text-red-700" : "text-slate-900"
                        }`}
                      >
                        {formatSigned(saldo)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
                </table>
            </div>
        )}
      </Card>

      {mapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            {/* O conteúdo completo do Modal do Mapa de Transferências deve ser mantido aqui */}
        </div>
      )}
      
      <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-white shadow-md">
        <h4 className="text-md font-semibold text-slate-800 mb-4">Legenda das Colunas</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-4 h-4 mt-1 flex-shrink-0 rounded border border-slate-300 bg-amber-50"></span>
            <div>
              <dt className="font-semibold text-sm text-slate-800">MELHOR VISÃO</dt>
              <dd className="text-sm text-slate-600">Soma total dos valores executados e previstos para cada item ao longo dos 12 meses.</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-4 h-4 mt-1 flex-shrink-0 rounded border border-slate-300 bg-sky-50"></span>
            <div>
              <dt className="font-semibold text-sm text-slate-800">META</dt>
              <dd className="text-sm text-slate-600">Valor orçamentário alvo definido para o plano ou subplano.</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-4 h-4 mt-1 flex-shrink-0 rounded border border-slate-300 bg-violet-50"></span>
            <div>
              <dt className="font-semibold text-sm text-slate-800">TRANSFERÊNCIA (líquida)</dt>
              <dd className="text-sm text-slate-600">Saldo de valores movimentados entre subplanos (entradas − saídas).</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex flex-shrink-0 mt-1 gap-1">
                <span className="w-4 h-4 rounded border border-slate-300 bg-emerald-50"></span>
                <span className="w-4 h-4 rounded border border-slate-300 bg-rose-50"></span>
            </div>
            <div>
              <dt className="font-semibold text-sm text-slate-800">SALDO A DISTRIBUIR</dt>
              <dd className="text-sm text-slate-600">Valor restante do orçamento. Saldo positivo (verde) indica sobra; negativo (vermelho) indica estouro. Calculado como: <code className="text-xs bg-slate-100 p-1 rounded">META - MELHOR VISÃO + TRANSFERÊNCIA</code>.</dd>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
