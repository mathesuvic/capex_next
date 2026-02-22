// components/capex/capex-table.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, CheckCircle2, AlertCircle, CircleDot, Database } from "lucide-react";
import { PhysicalInputModal } from './physical-input-modal';
import { normalizeLabel } from "@/lib/utils"; // >>> NOVO: Importa a função de utils

// Tipagens e Funções Helper
type CapexStatus = 'PENDENTE' | 'FINALIZADO' | 'PARCIAL';
interface RowData { id: number | string; label: string; capex: string; sublevel?: number; color?: string; cells: CellData[]; computed?: boolean; meta?: number; transfers?: TransferEntry[]; transferNet?: number; status_capex?: CapexStatus; }
interface CellData { value: number | string; type: "realizado" | "previsto"; }
interface TransferEntry { id?: number | string; amount: number; to?: string; toId?: number; }
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const parseEnvEditableMonths = () => (process.env.NEXT_PUBLIC_CAPEX_EDITABLE_MONTHS ?? "9,10,11,12").split(",").map((s) => parseInt(s.trim(), 10) - 1).filter((m) => Number.isFinite(m) && m >= 0 && m < 12);
function calculateTotal(rowCells: CellData[]) { return rowCells.reduce((sum, c) => sum + (typeof c.value === "number" ? c.value : 0), 0); }
const formatNumber = (num: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(num);
const formatSigned = (n: number) => `${n > 0 ? "+" : ""}${formatNumber(n)}`;
// >>> REMOVIDO: A definição local da função normalizeLabel foi movida para utils.ts
const sumOutgoing = (row: RowData) => (row.transfers ?? []).reduce((s, t) => s + (Number.isFinite(t.amount) ? t.amount : 0), 0);

function buildIncomingIndex(rows: RowData[]) {
  const sublabels = new Set(rows.filter((r) => r.sublevel === 1).map((r) => r.label));
  const temp: Record<string, Record<string, number>> = {};
  rows.forEach((r) => { (r.transfers ?? []).forEach((t) => { if (!t?.to || !Number.isFinite(t.amount)) return; if (!sublabels.has(t.to)) return; temp[t.to] = temp[t.to] || {}; temp[t.to][r.label] = (temp[t.to][r.label] || 0) + t.amount; }); });
  const result: Record<string, { from: string; amount: number }[]> = {};
  Object.entries(temp).forEach(([dest, byFrom]) => { result[dest] = Object.entries(byFrom).map(([from, amount]) => ({ from, amount })); });
  return result;
}

function computeDisplay(rows: RowData[], editableMonths: Set<number>) {
  const res = rows.map((r) => ({ ...r, cells: r.cells.map((c) => ({ ...c })) }));
  const subIndex = new Map<string, number>();
  res.forEach((r, i) => { if (r.sublevel === 1) subIndex.set(r.label, i); });
  const outgoing = res.map(sumOutgoing);
  const incoming = Array(res.length).fill(0);
  res.forEach((r) => { (r.transfers ?? []).forEach((t) => { if (!t?.to) return; const idx = subIndex.get(t.to); if (idx !== undefined && Number.isFinite(t.amount)) incoming[idx] += t.amount; }); });
  const net = res.map((_, i) => incoming[i] - outgoing[i]);
  let i = 0;
  while (i < res.length) {
    const row = res[i];
    if (row.sublevel === undefined) {
      const agg = Array(12).fill(0);
      const monthIsPrevisto = Array(12).fill(false) as boolean[];
      let metaSum = 0; let netSum = 0;
      const childrenStatuses: CapexStatus[] = [];
      let j = i + 1;
      while (j < res.length && res[j].sublevel === 1) {
        res[j].cells.forEach((cell, idx) => { agg[idx] += typeof cell.value === "number" ? cell.value : 0; if (cell.type === "previsto") monthIsPrevisto[idx] = true; });
        metaSum += res[j].meta ?? 0; netSum += net[j]; res[j] = { ...res[j], transferNet: net[j] };
        if (res[j].status_capex) { childrenStatuses.push(res[j].status_capex!); }
        j++;
      }
      let parentStatus: CapexStatus = 'PENDENTE';
      if (childrenStatuses.length > 0) { if (childrenStatuses.every(s => s === 'FINALIZADO')) { parentStatus = 'FINALIZADO'; } else if (childrenStatuses.some(s => s === 'FINALIZADO')) { parentStatus = 'PARCIAL'; } }
      for (let mi = 0; mi < 12; mi++) { if (editableMonths.has(mi)) monthIsPrevisto[mi] = true; }
      res[i] = { ...row, computed: true, meta: metaSum, transferNet: netSum, status_capex: parentStatus, cells: agg.map((v, idx) => ({ value: v, type: monthIsPrevisto[idx] ? ("previsto" as const) : ("realizado" as const), })) };
      i = j;
    } else { res[i] = { ...res[i], cells: res[i].cells.map((c, idx) => ({ value: c.value, type: editableMonths.has(idx) ? "previsto" : c.type, })) }; i++; }
  }
  return res;
}

function buildTransferMatrix(rows: RowData[]) {
  const labels = rows.filter((r) => r.sublevel === 1).map((r) => r.label);
  const idxMap = new Map(labels.map((l, i) => [l, i] as const));
  const n = labels.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  const outgoing = Array(n).fill(0); const incoming = Array(n).fill(0);
  rows.forEach((r) => { if (r.sublevel !== 1) return; const fromIdx = idxMap.get(r.label)!; (r.transfers ?? []).forEach((t) => { if (!t?.to || !Number.isFinite(t.amount)) return; const toIdx = idxMap.get(t.to); if (toIdx == null) return; matrix[fromIdx][toIdx] += t.amount; outgoing[fromIdx] += t.amount; incoming[toIdx] += t.amount; }); });
  const net = labels.map((_, i) => incoming[i] - outgoing[i]);
  const max = matrix.reduce((m, row) => Math.max(m, ...row), 0);
  return { labels, matrix, outgoing, incoming, net, max };
}

function heatClass(v: number, max: number) { if (v <= 0 || max <= 0) return "bg-white"; const q = v / max; if (q > 0.8) return "bg-emerald-400/60"; if (q > 0.6) return "bg-emerald-300/60"; if (q > 0.4) return "bg-emerald-200/60"; if (q > 0.2) return "bg-emerald-100/60"; return "bg-emerald-50"; }

type PermissionsResponse = | { isAdmin: true; allowedLabels: "ALL" } | { isAdmin: false; allowedLabels: string[] };

interface ModalState {
  isOpen: boolean;
  capexItem: { capex: string; label: string; };
  targetTotal: number;
}

export function CapexTable() {
  const [data, setData] = useState<RowData[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapTab, setMapTab] = useState<"matrix" | "list">("matrix");
  const [query, setQuery] = useState("");
  const [hideZeros, setHideZeros] = useState(true);
  const [editableMonths, setEditableMonths] = useState<Set<number>>(() => new Set(parseEnvEditableMonths()));
  const [isAdmin, setIsAdmin] = useState(false);
  const [allowedLabels, setAllowedLabels] = useState<Set<string>>(() => new Set());
  const [savingState, setSavingState] = useState<{ [rowIndex: number]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [physicalInputModal, setPhysicalInputModal] = useState<ModalState | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/capex", { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error("Falha ao buscar /api/capex");
        const json = (await res.json()) as RowData[];
        setData(json);
        setExpandedPlans(new Set(json.filter(r => r.sublevel === undefined).map(r => r.label)));
      } catch (e) { if ((e as any)?.name !== "AbortError") { console.error(e); } } 
      finally { setIsLoading(false); }
    })();
    return () => { controller.abort(); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/me/permissions", { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error("Falha ao buscar /api/me/permissions");
        const json = (await res.json()) as PermissionsResponse;
        if (json.isAdmin && json.allowedLabels === "ALL") { setIsAdmin(true); setAllowedLabels(new Set()); } 
        else { setIsAdmin(false); setAllowedLabels(new Set(json.allowedLabels.map(normalizeLabel))); }
      } catch (e) { if ((e as any)?.name !== "AbortError") { console.error(e); setIsAdmin(false); setAllowedLabels(new Set()); } }
    })();
    return () => { controller.abort(); };
  }, []);

  const subplans = useMemo(() => data.filter((r) => r.sublevel === 1).map((r) => ({ label: r.label, id: r.id })), [data]);
  const sublevelOptions = subplans.map((s) => s.label);
  const incomingIndex = useMemo(() => buildIncomingIndex(data), [data]);
  const displayData = useMemo(() => computeDisplay(data, editableMonths), [data, editableMonths]);
  const togglePlanExpansion = (planLabel: string) => { setExpandedPlans(prev => { const next = new Set(prev); if (next.has(planLabel)) { next.delete(planLabel); } else { next.add(planLabel); } return next; }); };
  const expandAll = () => { const allPlanLabels = new Set(data.filter(r => r.sublevel === undefined).map(r => r.label)); setExpandedPlans(allPlanLabels); };
  const collapseAll = () => { setExpandedPlans(new Set()); };
  const visibleRows = useMemo(() => {
    if (isLoading) return [];
    const rows: RowData[] = [];
    let currentPlanLabel: string | null = null;
    for (const row of displayData) {
      if (row.sublevel === undefined) { currentPlanLabel = row.label; rows.push(row); } 
      else if (row.sublevel === 1) { if (currentPlanLabel && expandedPlans.has(currentPlanLabel)) { rows.push(row); } }
    }
    return rows;
  }, [displayData, expandedPlans, isLoading]);
  const canEditRowLabel = (row: RowData) => { if (isAdmin) return true; return allowedLabels.has(normalizeLabel(row.label)); };

  const openPhysicalInputModal = (row: RowData) => {
    if (row.sublevel !== 1 || !canEditRowLabel(row)) return;
    const targetTotal = row.cells.reduce((sum, cell, index) => {
      if (editableMonths.has(index) && typeof cell.value === 'number') {
        return sum + cell.value;
      }
      return sum;
    }, 0);
    setPhysicalInputModal({
      isOpen: true,
      capexItem: { capex: row.capex, label: row.label },
      targetTotal: targetTotal,
    });
  };
  
  const handleToggleStatus = async (rowToUpdate: RowData) => {
    const originalStatus = rowToUpdate.status_capex || 'PENDENTE';
    const newStatus = originalStatus === 'FINALIZADO' ? 'PENDENTE' : 'FINALIZADO';

    setData(prevData => prevData.map(row => 
      row.capex === rowToUpdate.capex ? { ...row, status_capex: newStatus } : row
    ));

    try {
      const res = await fetch('/api/capex/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capex: rowToUpdate.capex, status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Falha ao ${newStatus === 'FINALIZADO' ? 'finalizar' : 'reabrir'} o subplano.`);
      }
    } catch (error) {
      console.error(error);
      setData(prevData => prevData.map(row => 
        row.capex === rowToUpdate.capex ? { ...row, status_capex: originalStatus } : row
      ));
      alert(`Não foi possível alterar o status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleCellChange = async (row: RowData, rowIndex: number, cellIndex: number, value: string) => {
    const numValue = value === "" ? 0 : Number.parseFloat(value) || 0;
    if (!canEditRowLabel(row)) return;
    setData((prev) => {
      const copy = structuredClone(prev) as RowData[];
      const originalRowIndex = copy.findIndex(r => r.capex === row.capex);
      if (originalRowIndex === -1) return prev;
      copy[originalRowIndex].cells[cellIndex].value = numValue;
      return copy;
    });
    if (row.sublevel === 1 && editableMonths.has(cellIndex)) {
      try {
        const month = cellIndex + 1;
        const res = await fetch(`/api/capex/values`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month, value: numValue, label: row.label }) });
        if (!res.ok) { console.warn("PUT /api/capex/values falhou:", res.status, await res.json().catch(() => ({}))); }
      } catch (e) { console.error(e); }
    }
  };

  const addTransfer = (rowIndex: number) => {
    const row = data[rowIndex];
    if (!row?.label || !canEditRowLabel(row)) return;
    const newTransfer: TransferEntry = { id: `temp_${Date.now()}`, amount: 0, to: "" };
    setData((prev) => {
      const copy = structuredClone(prev) as RowData[];
      copy[rowIndex].transfers = [...(copy[rowIndex].transfers ?? []), newTransfer];
      return copy;
    });
  };

  const removeTransfer = (rowIndex: number, transferId: number | string) => {
    const row = data[rowIndex];
    if (!row || !canEditRowLabel(row)) return;
    setData((prev) => {
      const copy = structuredClone(prev) as RowData[];
      copy[rowIndex].transfers = (copy[rowIndex].transfers ?? []).filter((t) => t.id !== transferId);
      return copy;
    });
  };

  const updateTransferAmount = (rowIndex: number, transferId: string | number, value: string) => {
    const row = data[rowIndex];
    if (!row || !canEditRowLabel(row)) return;
    const amount = value === "" ? 0 : Number.parseFloat(value) || 0;
    setData((prev) => {
      const copy = structuredClone(prev) as RowData[];
      copy[rowIndex].transfers = (copy[rowIndex].transfers ?? []).map((t) => (t.id === transferId ? { ...t, amount } : t));
      return copy;
    });
  };

  const updateTransferTarget = (rowIndex: number, transferId: string | number, toLabel: string) => {
    const row = data[rowIndex];
    if (!row || !canEditRowLabel(row)) return;
    const dest = data.find((r) => r.sublevel === 1 && r.label === toLabel);
    setData((prev) => {
      const copy = structuredClone(prev) as RowData[];
      copy[rowIndex].transfers = (copy[rowIndex].transfers ?? []).map((t) => (t.id === transferId ? { ...t, to: toLabel, toId: dest?.id } : t));
      return copy;
    });
  };

  const saveTransfers = async (rowIndex: number) => {
    const row = data[rowIndex];
    if (!row || !canEditRowLabel(row)) return;
    setSavingState((prev) => ({ ...prev, [rowIndex]: true }));
    const transfersToSave = (row.transfers ?? []).map(({ amount, to }) => ({ amount, to })).filter((t) => t.amount > 0 && t.to);
    try {
      const res = await fetch(`/api/capex/transfers`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fromLabel: row.label, transfers: transfersToSave }) });
      if (!res.ok) { throw new Error(await res.text()); }
      const savedTransfers = await res.json();
      setData((prev) => {
        const copy = structuredClone(prev) as RowData[];
        copy[rowIndex].transfers = savedTransfers;
        return copy;
      });
    } catch (e) { console.error("Erro ao salvar transferências:", e); } 
    finally { setSavingState((prev) => ({ ...prev, [rowIndex]: false })); }
  };

  const map = useMemo(() => buildTransferMatrix(data), [data]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { labels: map.labels, rows: map.matrix, idxs: map.labels.map((_, i) => i) };
    const idxs = map.labels.map((l, i) => ({ l, i })).filter(({ l }) => l.toLowerCase().includes(q)).map(({ i }) => i);
    return { labels: idxs.map((i) => map.labels[i]), rows: idxs.map((i) => idxs.map((j) => map.matrix[i][j])), idxs };
  }, [map, query]);
  const edges = useMemo(() => {
    const list: { from: string; to: string; amount: number }[] = [];
    map.labels.forEach((from, i) => { map.labels.forEach((to, j) => { const v = map.matrix[i][j]; if (v > 0) list.push({ from, to, amount: v }); }); });
    return list.sort((a, b) => b.amount - a.amount);
  }, [map]);
  const exportCSV = () => {
    const csv = "origem,destino,valor\n" + edges.map((e) => `"${e.from}","${e.to}",${e.amount}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transferencias.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card className="overflow-hidden border border-slate-200 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <h3 className="text-sm font-semibold text-slate-800">CAPEX (R$ Mil)</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={expandAll} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded px-3 py-1.5 border border-slate-300">Abrir Todos</button>
              <button onClick={collapseAll} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded px-3 py-1.5 border border-slate-300">Fechar Todos</button>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-600 mr-2">Meses editáveis:</span>
              {MONTHS.map((m, idx) => (<button key={idx} className={`text-xs px-2 py-1 rounded border ${editableMonths.has(idx) ? "bg-[#e6f7f0] border-[#00823B] text-[#00663a]" : "bg-white hover:bg-slate-50"}`}>{m}</button>))}
            </div>
            <button onClick={() => setMapOpen(true)} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1.5" disabled={isLoading}>Mapa de Transferências</button>
          </div>
        </div>
        {isLoading ? ( <div className="p-6 text-sm text-slate-600">Carregando...</div> ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#00823B] text-white">
                  <th className="sticky left-0 z-20 bg-[#00823B] border border-[#004d23] px-4 py-3 text-left font-semibold min-w-64">CAPEX (R$ Mil)</th>
                  {MONTHS.map((m, idx) => (<th key={idx} className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-32 text-sm">{m}/25</th>))}
                  <th className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-40 bg-[#FFB81C] text-slate-900 font-bold">MELHOR VISÃO</th>
                  <th className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-40 bg-slate-100 text-slate-900 font-bold">META</th>
                  <th className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-56 bg-indigo-50 text-slate-900 font-bold">TRANSFERÊNCIA (líquida)</th>
                  <th className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-48 bg-sky-50 text-slate-900 font-bold">SALDO A DISTRIBUIR</th>
                  <th className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-40 bg-slate-700 text-white">STATUS</th>
                  <th className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-40 bg-slate-600">INPUT FÍSICOS</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const rowIndex = data.findIndex(d => d.capex === row.capex);
                  const total = calculateTotal(row.cells);
                  const isSubLevel = row.sublevel === 1;
                  const isPlano = row.sublevel === undefined;
                  const net = row.transferNet ?? 0;
                  const metaVal = row.meta ?? 0;
                  const saldo = metaVal - total + net;
                  const incomingList = isSubLevel ? (incomingIndex[row.label] ?? []) : [];
                  const canEditRow = isSubLevel && canEditRowLabel(row);
                  const isSaving = rowIndex !== -1 ? savingState[rowIndex] === true : false;
                  const isExpanded = isPlano && expandedPlans.has(row.label);

                  return (
                    <tr key={row.capex} className={`${row.color || (isSubLevel ? "bg-white" : "bg-slate-50")} border-b border-slate-200 hover:bg-slate-50 transition-colors`}>
                      <td className={`sticky left-0 z-10 border border-slate-200 px-4 py-3 font-medium ${row.color || (isSubLevel ? "bg-white" : "bg-slate-50")} ${isSubLevel ? "pl-8 text-slate-700" : "text-slate-900"}`}>
                        <div className="flex items-center gap-2">
                          {isPlano && (<button onClick={() => togglePlanExpansion(row.label)} className="p-1 -ml-1 rounded-full hover:bg-slate-200"><ChevronDown size={16} className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} /></button>)}
                          <span>{row.label}</span>
                        </div>
                        {isSubLevel && !canEditRow && (<div className="mt-1 text-[11px] text-slate-500">Sem permissão para editar</div>)}
                      </td>
                      {row.cells.map((cell, cellIndex) => {
                        const isEditable = isSubLevel && editableMonths.has(cellIndex) && canEditRow;
                        const isLocked = row.status_capex === 'FINALIZADO';
                        return (
                          <td key={cellIndex} className={`border border-slate-200 px-3 py-3 text-center min-w-32 ${!editableMonths.has(cellIndex) ? "bg-[#e6f0ff] text-slate-900" : "bg-white"}`}>
                            {isEditable ? (<input type="number" value={cell.value === 0 ? "" : cell.value} onChange={(e) => handleCellChange(row, rowIndex, cellIndex, e.target.value)} className={`w-full border rounded px-2 py-1 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00823B] focus:bg-white ${isLocked ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-[#e6f7f0] border-[#00823B]'}`} placeholder="0" disabled={isLocked} />) : (<span className="text-sm font-medium text-slate-700">{formatNumber(typeof cell.value === "number" ? cell.value : 0)}</span>)}
                          </td>
                        );
                      })}
                      <td className="border border-slate-200 px-3 py-3 text-center font-bold text-slate-900 bg-[#fff3e0] min-w-40"><span className="text-sm">{formatNumber(total)}</span></td>
                      <td className="border border-slate-200 px-3 py-3 text-center font-bold text-slate-900 bg-slate-100 min-w-40"><span className="text-sm">{formatNumber(metaVal)}</span></td>
                      <td className="border border-slate-200 px-3 py-3 text-center bg-indigo-50 min-w-56">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className={`text-sm font-bold ${net > 0 ? "text-emerald-700" : net < 0 ? "text-red-700" : "text-slate-900"}`}>{formatSigned(net)}</span>
                          {isSubLevel && (<span className="text-[11px] text-slate-600">Entradas: <span className="text-emerald-700 font-medium">+{incomingList.length}</span> | Saídas: <span className="text-red-700 font-medium">{rowIndex !== -1 && data[rowIndex] ? (data[rowIndex].transfers ?? []).length : 0}</span></span>)}
                          {isSubLevel && rowIndex !== -1 && data[rowIndex] && (
                            <details className="relative mt-1">
                              <summary className="cursor-pointer text-xs text-indigo-700 underline decoration-dotted select-none">detalhes</summary>
                              <div className="absolute right-0 mt-2 w-[520px] bg-white border border-slate-200 rounded shadow p-3 z-30 text-left">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-xs font-semibold text-emerald-700 mb-2">Entradas (por origem)</h4>
                                    <div className="max-h-56 overflow-auto space-y-2">{incomingList.length > 0 ? (incomingList.map((inc, idx) => (<div key={idx} className="flex items-center justify-between border border-emerald-100 rounded px-2 py-1"><span className="text-xs text-slate-700">{inc.from}</span><span className="text-xs font-semibold text-emerald-700">+{formatNumber(inc.amount)}</span></div>))) : (<p className="text-xs text-slate-500">Sem entradas.</p>)}</div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-semibold text-red-700 mb-2">Saídas</h4>
                                    {!canEditRow && (<p className="text-xs text-slate-500 mb-2">Você não tem permissão para editar saídas desta linha.</p>)}
                                    <div className="max-h-56 overflow-auto space-y-2">
                                      {(data[rowIndex].transfers ?? []).map((t) => (
                                        <div key={t.id} className="grid grid-cols-12 gap-2 items-end">
                                          <div className="col-span-5"><label className="text-[11px] text-slate-500">Valor (saída)</label><input type="number" value={t.amount === 0 ? "" : t.amount} onChange={(e) => updateTransferAmount(rowIndex, t.id!, e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100" placeholder="0" disabled={!canEditRow || isSaving}/></div>
                                          <div className="col-span-6"><label className="text-[11px] text-slate-500">Destino (subplano)</label><select value={t.to ?? ""} onChange={(e) => updateTransferTarget(rowIndex, t.id!, e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-white disabled:bg-slate-100" disabled={!canEditRow || isSaving}><option value="" disabled>Selecione</option>{sublevelOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}</select></div>
                                          <div className="col-span-1"><button onClick={() => removeTransfer(rowIndex, t.id!)} className="text-xs text-red-600 hover:underline disabled:opacity-50" disabled={!canEditRow || isSaving}>x</button></div>
                                        </div>
                                      ))}
                                      {(!data[rowIndex].transfers || data[rowIndex]!.transfers!.length === 0) && (<p className="text-xs text-slate-500">Sem saídas.</p>)}
                                    </div>
                                    <div className="mt-4 pt-2 border-t flex items-center justify-between">
                                      <button onClick={() => addTransfer(rowIndex)} className="bg-slate-200 text-slate-800 text-xs rounded px-2 py-1 hover:bg-slate-300 disabled:opacity-50" disabled={!canEditRow || isSaving}>Adicionar saída</button>
                                      <button onClick={() => saveTransfers(rowIndex)} className="bg-indigo-600 text-white text-xs rounded px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50" disabled={!canEditRow || isSaving}>{isSaving ? "Salvando..." : "Salvar"}</button>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 text-xs text-slate-700 border-t pt-2">Líquido (entradas − saídas): <span className={`font-semibold ${net > 0 ? "text-emerald-700" : net < 0 ? "text-red-700" : "text-slate-900"}`}>{formatSigned(net)}</span></div>
                              </div>
                            </details>
                          )}
                          {isPlano && (<p className="mt-1 text-[11px] text-slate-500">Soma das transferências líquidas.</p>)}
                        </div>
                      </td>
                      <td className={`border border-slate-200 px-3 py-3 text-center min-w-48 ${saldo > 0 ? "bg-emerald-50" : saldo < 0 ? "bg-rose-50" : "bg-sky-50"}`}><span className={`text-sm font-bold ${saldo > 0 ? "text-emerald-700" : saldo < 0 ? "text-red-700" : "text-slate-900"}`}>{formatSigned(saldo)}</span></td>
                      <td className="border border-slate-200 px-3 py-3 text-center">
                        {isSubLevel && (
                           <div className="group relative flex justify-center items-center">
                            {row.status_capex === 'FINALIZADO' ? (
                              <button
                                onClick={() => handleToggleStatus(row)}
                                disabled={!canEditRow}
                                className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full border border-transparent transition-colors hover:bg-amber-100 hover:text-amber-800 hover:border-amber-400 disabled:hover:bg-emerald-100 disabled:hover:text-emerald-700 disabled:hover:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                <CheckCircle2 size={14} />
                                Finalizado
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleToggleStatus(row)}
                                disabled={!canEditRow}
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1.5 disabled:bg-slate-300 disabled:cursor-not-allowed"
                              >
                                Finalizar
                              </button>
                            )}
                            {row.status_capex === 'FINALIZADO' && canEditRow && (
                                <span className="absolute -top-8 w-max bg-slate-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    Reabrir para edição
                                </span>
                            )}
                          </div>
                        )}
                        {isPlano && (
                          <>
                            {row.status_capex === 'FINALIZADO' && (<span className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full"><CheckCircle2 size={14} />Finalizado</span>)}
                            {row.status_capex === 'PARCIAL' && (<span className="flex items-center justify-center gap-2 text-xs font-semibold text-yellow-800 bg-yellow-100 px-3 py-1.5 rounded-full"><AlertCircle size={14} />Parcial</span>)}
                            {row.status_capex === 'PENDENTE' && (<span className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 bg-slate-200 px-3 py-1.5 rounded-full"><CircleDot size={14} />Pendente</span>)}
                          </>
                        )}
                      </td>
                      <td className="border border-slate-200 px-3 py-3 text-center">
                        {isSubLevel && row.status_capex === 'FINALIZADO' && (
                            <button 
                                onClick={() => openPhysicalInputModal(row)}
                                disabled={!canEditRow}
                                className="flex w-full items-center justify-center gap-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded px-3 py-1.5 border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Database size={14} /> Detalhar
                            </button>
                        )}
                        {isSubLevel && row.status_capex !== 'FINALIZADO' && (
                            <span className="text-xs text-slate-500 italic">Finalize para detalhar</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 space-y-2">
          <p className="text-sm text-slate-600"><span className="inline-block w-3 h-3 bg-[#e6f0ff] border border-[#0066CC] rounded mr-2"></span>Valores em <strong>azul</strong> são dados de meses não-editáveis.</p>
          <p className="text-sm text-slate-600"><span className="inline-block w-3 h-3 bg-[#e6f7f0] border border-[#00823B] rounded mr-2"></span>Valores em <strong>verde</strong> são meses marcados como <strong>editáveis/previstos</strong>.</p>
          <p className="text-sm text-slate-600"><span className="inline-block w-3 h-3 bg-indigo-50 border border-indigo-200 rounded mr-2"></span><strong>Transferência (líquida)</strong> = entradas − saídas. <strong>Saldo a Distribuir</strong> = META − MELHOR VISÃO + Transferência.</p>
        </div>
        {mapOpen && !isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMapOpen(false)} />
            <div className="relative bg-white w-[90vw] max-w-6xl max-h-[85vh] rounded-lg border shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h4 className="text-sm font-semibold text-slate-800">Mapa de Transferências</h4>
                <div className="flex items-center gap-2">
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrar por subplano..." className="text-sm border rounded px-2 py-1"/>
                  <label className="text-xs text-slate-700 flex items-center gap-1"><input type="checkbox" checked={hideZeros} onChange={(e) => setHideZeros(e.target.checked)} />Ocultar zeros</label>
                  <button onClick={exportCSV} className="text-xs bg-slate-100 hover:bg-slate-200 rounded px-2 py-1 border">Exportar CSV</button>
                  <button onClick={() => setMapOpen(false)} className="text-xs bg-slate-800 text-white hover:bg-slate-900 rounded px-2 py-1">Fechar</button>
                </div>
              </div>
              <div className="px-4 pt-3">
                <div className="flex items-center gap-4 mb-3">
                  <button onClick={() => setMapTab("matrix")} className={`text-xs px-3 py-1.5 rounded border ${mapTab === "matrix" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-slate-50"}`}>Matriz</button>
                  <button onClick={() => setMapTab("list")} className={`text-xs px-3 py-1.5 rounded border ${mapTab === "list" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-slate-50"}`}>Lista</button>
                </div>
                {mapTab === "matrix" ? (
                  <div className="overflow-auto max-h-[65vh] pb-4"><table className="border-collapse"><thead><tr><th className="sticky left-0 z-10 bg-white border px-2 py-1 text-xs text-slate-700 text-left">Origem ↓ / Destino →</th>{filtered.labels.map((dest, j) => (<th key={j} className="border px-2 py-1 text-xs text-slate-700">{dest}</th>))}<th className="border px-2 py-1 text-xs font-semibold bg-slate-50">Saída total</th><th className="border px-2 py-1 text-xs font-semibold bg-slate-50">Saldo líquido</th></tr></thead><tbody>{filtered.rows.map((row, iRow) => { const idx = filtered.idxs[iRow]; const out = map.outgoing[idx]; const netRow = map.net[idx]; return ( <tr key={iRow} className="hover:bg-slate-50"><td className="sticky left-0 z-10 bg-white border px-2 py-1 text-xs text-slate-700">{filtered.labels[iRow]}</td>{row.map((v, j) => (<td key={j} className={`border px-2 py-1 text-xs text-right align-middle ${hideZeros && v === 0 ? "text-slate-300" : ""} ${heatClass(v, map.max)}`}>{v === 0 && hideZeros ? "" : formatNumber(v)}</td>))}<td className="border px-2 py-1 text-xs text-right font-semibold bg-slate-50 text-red-700">{formatNumber(out)}</td><td className={`border px-2 py-1 text-xs text-right font-semibold bg-slate-50 ${netRow >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatSigned(netRow)}</td></tr> ); })}<tr><td className="sticky left-0 z-10 bg-slate-50 border px-2 py-1 text-xs font-semibold">Entrada total</td>{filtered.labels.map((_, j) => { const idx = filtered.idxs[j]; const inc = map.incoming[idx]; return (<td key={j} className="border px-2 py-1 text-xs text-right font-semibold bg-slate-50 text-emerald-700">{formatNumber(inc)}</td>); })}<td className="border px-2 py-1 text-xs bg-slate-50" /><td className="border px-2 py-1 text-xs bg-slate-50" /></tr></tbody></table></div>
                ) : (
                  <div className="max-h-[65vh] overflow-auto pb-4"><table className="w-full border-collapse"><thead><tr className="bg-slate-50"><th className="border px-2 py-1 text-xs text-left">Origem</th><th className="border px-2 py-1 text-xs text-left">Destino</th><th className="border px-2 py-1 text-xs text-right">Valor</th></tr></thead><tbody>{edges.filter((e) => { const q = query.trim().toLowerCase(); if (!q) return true; return e.from.toLowerCase().includes(q) || e.to.toLowerCase().includes(q); }).map((e, i) => (<tr key={i} className="hover:bg-slate-50"><td className="border px-2 py-1 text-xs">{e.from}</td><td className="border px-2 py-1 text-xs">{e.to}</td><td className="border px-2 py-1 text-xs text-right">{formatNumber(e.amount)}</td></tr>))}{edges.length === 0 && (<tr><td colSpan={3} className="text-center text-xs text-slate-500 py-4">Sem transferências.</td></tr>)}</tbody></table></div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
      
      {physicalInputModal && physicalInputModal.isOpen && ( 
        <PhysicalInputModal 
          {...physicalInputModal} 
          onClose={() => setPhysicalInputModal(null)} 
        /> 
      )}
    </>
  );
}
