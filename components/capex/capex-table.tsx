// components/capex/capex-table.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  ChevronDown, CheckCircle2, AlertCircle, CircleDot,
  Database, XCircle, BarChart2, ArrowRightLeft,
  ChevronRight, Loader2
} from "lucide-react";
import { PhysicalInputModal } from './physical-input-modal';
import { normalizeLabel } from "@/lib/utils";

// ─── Tipos ───────────────────────────────────────────────────────────────────
type CapexStatus   = 'PENDENTE' | 'FINALIZADO' | 'PARCIAL';
type PhysicalStatus = 'SIM' | 'NAO' | 'PENDENTE';

interface RowData {
  id: number | string; label: string; capex: string;
  sublevel?: number; color?: string; cells: CellData[];
  computed?: boolean; meta?: number; transfers?: TransferEntry[];
  transferNet?: number; status_capex?: CapexStatus; status_fisico?: PhysicalStatus;
}
interface CellData { value: number | string; type: "realizado" | "previsto"; }
interface TransferEntry { id?: number | string; amount: number; to?: string; toId?: number; }

type PermissionsResponse =
  | { isAdmin: true;  allowedLabels: "ALL" }
  | { isAdmin: false; allowedLabels: string[] };

interface ModalState {
  isOpen: boolean;
  capexItem: { capex: string; label: string };
  financialDataForModal: Record<string, number>;
}

// ─── Constantes ──────────────────────────────────────────────────────────────
const MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

const parseEnvEditableMonths = () =>
  (process.env.NEXT_PUBLIC_CAPEX_EDITABLE_MONTHS ?? "9,10,11,12")
    .split(",").map(s => parseInt(s.trim(), 10) - 1)
    .filter(m => Number.isFinite(m) && m >= 0 && m < 12);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtN  = (n: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);
const fmtSg = (n: number) => `${n > 0 ? "+" : ""}${fmtN(n)}`;

function calculateTotal(cells: CellData[]) {
  return cells.reduce((s, c) => s + (typeof c.value === "number" ? c.value : 0), 0);
}
const sumOutgoing = (row: RowData) =>
  (row.transfers ?? []).reduce((s, t) => s + (Number.isFinite(t.amount) ? t.amount : 0), 0);

function buildIncomingIndex(rows: RowData[]) {
  const sublabels = new Set(rows.filter(r => r.sublevel === 1).map(r => r.label));
  const temp: Record<string, Record<string, number>> = {};
  rows.forEach(r => {
    (r.transfers ?? []).forEach(t => {
      if (!t?.to || !Number.isFinite(t.amount) || !sublabels.has(t.to)) return;
      temp[t.to] = temp[t.to] || {};
      temp[t.to][r.label] = (temp[t.to][r.label] || 0) + t.amount;
    });
  });
  const result: Record<string, { from: string; amount: number }[]> = {};
  Object.entries(temp).forEach(([dest, byFrom]) => {
    result[dest] = Object.entries(byFrom).map(([from, amount]) => ({ from, amount }));
  });
  return result;
}

function computeDisplay(rows: RowData[], editableMonths: Set<number>) {
  const res = rows.map(r => ({ ...r, cells: r.cells.map(c => ({ ...c })) }));
  const subIndex = new Map<string, number>();
  res.forEach((r, i) => { if (r.sublevel === 1) subIndex.set(r.label, i); });
  const incoming = Array(res.length).fill(0);
  res.forEach(r => {
    (r.transfers ?? []).forEach(t => {
      if (!t?.to) return;
      const idx = subIndex.get(t.to);
      if (idx !== undefined && Number.isFinite(t.amount)) incoming[idx] += t.amount;
    });
  });
  const outgoing = res.map(sumOutgoing);
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
        res[j].cells.forEach((cell, idx) => {
          agg[idx] += typeof cell.value === "number" ? cell.value : 0;
          if (cell.type === "previsto") monthIsPrevisto[idx] = true;
        });
        metaSum += res[j].meta ?? 0;
        netSum += net[j];
        res[j] = { ...res[j], transferNet: net[j] };
        if (res[j].status_capex) childrenStatuses.push(res[j].status_capex!);
        j++;
      }
      let parentStatus: CapexStatus = 'PENDENTE';
      if (childrenStatuses.length > 0) {
        if (childrenStatuses.every(s => s === 'FINALIZADO')) parentStatus = 'FINALIZADO';
        else if (childrenStatuses.some(s => s === 'FINALIZADO')) parentStatus = 'PARCIAL';
      }
      for (let mi = 0; mi < 12; mi++) if (editableMonths.has(mi)) monthIsPrevisto[mi] = true;
      res[i] = {
        ...row, computed: true, meta: metaSum, transferNet: netSum, status_capex: parentStatus,
        cells: agg.map((v, idx) => ({ value: v, type: monthIsPrevisto[idx] ? "previsto" as const : "realizado" as const }))
      };
      i = j;
    } else {
      res[i] = {
        ...res[i],
        cells: res[i].cells.map((c, idx) => ({
          value: c.value,
          type: editableMonths.has(idx) ? "previsto" : c.type
        }))
      };
      i++;
    }
  }
  return res;
}

function buildTransferMatrix(rows: RowData[]) {
  const labels  = rows.filter(r => r.sublevel === 1).map(r => r.label);
  const idxMap  = new Map(labels.map((l, i) => [l, i] as const));
  const n       = labels.length;
  const matrix  = Array.from({ length: n }, () => Array(n).fill(0));
  const outgoing = Array(n).fill(0);
  const incoming = Array(n).fill(0);
  rows.forEach(r => {
    if (r.sublevel !== 1) return;
    const fromIdx = idxMap.get(r.label)!;
    (r.transfers ?? []).forEach(t => {
      if (!t?.to || !Number.isFinite(t.amount)) return;
      const toIdx = idxMap.get(t.to);
      if (toIdx == null) return;
      matrix[fromIdx][toIdx] += t.amount;
      outgoing[fromIdx] += t.amount;
      incoming[toIdx]   += t.amount;
    });
  });
  const net = labels.map((_, i) => incoming[i] - outgoing[i]);
  const max = matrix.reduce((m, row) => Math.max(m, ...row), 0);
  return { labels, matrix, outgoing, incoming, net, max };
}

function heatClass(v: number, max: number) {
  if (v <= 0 || max <= 0) return "bg-white";
  const q = v / max;
  if (q > 0.8) return "bg-emerald-400/60";
  if (q > 0.6) return "bg-emerald-300/60";
  if (q > 0.4) return "bg-emerald-200/60";
  if (q > 0.2) return "bg-emerald-100/60";
  return "bg-emerald-50";
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

/** Badge colorido de status capex */
function StatusBadge({ status }: { status: CapexStatus }) {
  if (status === 'FINALIZADO') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={11} />Finalizado
    </span>
  );
  if (status === 'PARCIAL') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <AlertCircle size={11} />Parcial
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
      <CircleDot size={11} />Pendente
    </span>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export function CapexTable() {
  const [data,            setData           ] = useState<RowData[]>([]);
  const [mapOpen,         setMapOpen        ] = useState(false);
  const [mapTab,          setMapTab         ] = useState<"matrix" | "list">("matrix");
  const [query,           setQuery          ] = useState("");
  const [hideZeros,       setHideZeros      ] = useState(true);
  const [editableMonths,  setEditableMonths ] = useState<Set<number>>(() => new Set(parseEnvEditableMonths()));
  const [isAdmin,         setIsAdmin        ] = useState(false);
  const [allowedLabels,   setAllowedLabels  ] = useState<Set<string>>(() => new Set());
  const [savingState,     setSavingState    ] = useState<Record<number, boolean>>({});
  const [isLoading,       setIsLoading      ] = useState(true);
  const [expandedPlans,   setExpandedPlans  ] = useState<Set<string>>(new Set());
  const [physicalInputModal, setPhysicalInputModal] = useState<ModalState | null>(null);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchData = async (controller: AbortController) => {
    setIsLoading(true);
    try {
      const res  = await fetch("/api/capex", { cache: "no-store", signal: controller.signal });
      if (!res.ok) throw new Error("Falha ao buscar /api/capex");
      const json = (await res.json()) as RowData[];
      setData(json);
      if (expandedPlans.size === 0 && json.length > 0) {
        setExpandedPlans(new Set(json.filter(r => r.sublevel === undefined).map(r => r.label)));
      }
    } catch (e) {
      if ((e as any)?.name !== "AbortError") console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const c = new AbortController();
    fetchData(c);
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const c = new AbortController();
    (async () => {
      try {
        const res  = await fetch("/api/me/permissions", { cache: "no-store", signal: c.signal });
        if (!res.ok) throw new Error();
        const json = (await res.json()) as PermissionsResponse;
        if (json.isAdmin && json.allowedLabels === "ALL") {
          setIsAdmin(true); setAllowedLabels(new Set());
        } else {
          setIsAdmin(false);
          setAllowedLabels(new Set((json.allowedLabels as string[]).map(normalizeLabel)));
        }
      } catch (e) {
        if ((e as any)?.name !== "AbortError") { setIsAdmin(false); setAllowedLabels(new Set()); }
      }
    })();
    return () => c.abort();
  }, []);

  // ── Memos ───────────────────────────────────────────────────────────────────
  const subplans       = useMemo(() => data.filter(r => r.sublevel === 1).map(r => ({ label: r.label, id: r.id })), [data]);
  const sublevelOptions = subplans.map(s => s.label);
  const incomingIndex  = useMemo(() => buildIncomingIndex(data), [data]);
  const displayData    = useMemo(() => computeDisplay(data, editableMonths), [data, editableMonths]);

  const visibleRows = useMemo(() => {
    if (isLoading) return [];
    const rows: RowData[] = [];
    let currentPlanLabel: string | null = null;
    for (const row of displayData) {
      if (row.sublevel === undefined) { currentPlanLabel = row.label; rows.push(row); }
      else if (row.sublevel === 1 && currentPlanLabel && expandedPlans.has(currentPlanLabel)) rows.push(row);
    }
    return rows;
  }, [displayData, expandedPlans, isLoading]);

  const map = useMemo(() => buildTransferMatrix(data), [data]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { labels: map.labels, rows: map.matrix, idxs: map.labels.map((_, i) => i) };
    const idxs = map.labels.map((l, i) => ({ l, i })).filter(({ l }) => l.toLowerCase().includes(q)).map(({ i }) => i);
    return { labels: idxs.map(i => map.labels[i]), rows: idxs.map(i => idxs.map(j => map.matrix[i][j])), idxs };
  }, [map, query]);

  const edges = useMemo(() => {
    const list: { from: string; to: string; amount: number }[] = [];
    map.labels.forEach((from, i) => {
      map.labels.forEach((to, j) => { const v = map.matrix[i][j]; if (v > 0) list.push({ from, to, amount: v }); });
    });
    return list.sort((a, b) => b.amount - a.amount);
  }, [map]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const canEditRowLabel = (row: RowData) => isAdmin || allowedLabels.has(normalizeLabel(row.label));

  const expandAll   = () => setExpandedPlans(new Set(data.filter(r => r.sublevel === undefined).map(r => r.label)));
  const collapseAll = () => setExpandedPlans(new Set());

  const togglePlanExpansion = (label: string) =>
    setExpandedPlans(prev => { const n = new Set(prev); n.has(label) ? n.delete(label) : n.add(label); return n; });

  const getFinancialDataForEditableMonths = (row: RowData): Record<string, number> => {
    const d: Record<string, number> = {};
    row.cells.forEach((cell, i) => {
      if (editableMonths.has(i)) d[MONTHS[i]] = typeof cell.value === "number" ? cell.value : 0;
    });
    return d;
  };

  const openPhysicalInputModal = (row: RowData) => {
    if (row.sublevel !== 1 || !canEditRowLabel(row)) return;
    setPhysicalInputModal({
      isOpen: true,
      capexItem: { capex: row.capex, label: row.label },
      financialDataForModal: getFinancialDataForEditableMonths(row),
    });
  };

  const handleToggleStatus = async (rowToUpdate: RowData) => {
    const originalStatus = rowToUpdate.status_capex || 'PENDENTE';
    const newStatus: CapexStatus = originalStatus === 'FINALIZADO' ? 'PENDENTE' : 'FINALIZADO';
    setData(prev => prev.map(r => r.capex === rowToUpdate.capex ? { ...r, status_capex: newStatus } : r));
    try {
      const res = await fetch('/api/capex/status', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capex: rowToUpdate.capex, status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro');
    } catch (error) {
      setData(prev => prev.map(r => r.capex === rowToUpdate.capex ? { ...r, status_capex: originalStatus } : r));
      alert(`Não foi possível alterar o status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleCellChange = async (row: RowData, _rowIndex: number, cellIndex: number, value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value) || 0;
    if (!canEditRowLabel(row)) return;
    setData(prev => {
      const copy = structuredClone(prev) as RowData[];
      const idx  = copy.findIndex(r => r.capex === row.capex);
      if (idx === -1) return prev;
      copy[idx].cells[cellIndex].value = numValue;
      return copy;
    });
    if (row.sublevel === 1 && editableMonths.has(cellIndex)) {
      try {
        await fetch('/api/capex/values', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month: cellIndex + 1, value: numValue, label: row.label }),
        });
      } catch (e) { console.error(e); }
    }
  };

  const addTransfer = (rowIndex: number) => {
    const row = data[rowIndex];
    if (!row?.label || !canEditRowLabel(row)) return;
    setData(prev => {
      const copy = structuredClone(prev) as RowData[];
      copy[rowIndex].transfers = [...(copy[rowIndex].transfers ?? []), { id: `temp_${Date.now()}`, amount: 0, to: "" }];
      return copy;
    });
  };

  const removeTransfer = (rowIndex: number, transferId: number | string) => {
    if (!canEditRowLabel(data[rowIndex])) return;
    setData(prev => {
      const copy = structuredClone(prev) as RowData[];
      copy[rowIndex].transfers = (copy[rowIndex].transfers ?? []).filter(t => t.id !== transferId);
      return copy;
    });
  };

  const updateTransferAmount = (rowIndex: number, transferId: string | number, value: string) => {
    if (!canEditRowLabel(data[rowIndex])) return;
    const amount = value === "" ? 0 : parseFloat(value) || 0;
    setData(prev => {
      const copy = structuredClone(prev) as RowData[];
      copy[rowIndex].transfers = (copy[rowIndex].transfers ?? []).map(t => t.id === transferId ? { ...t, amount } : t);
      return copy;
    });
  };

  const updateTransferTarget = (rowIndex: number, transferId: string | number, toLabel: string) => {
    if (!canEditRowLabel(data[rowIndex])) return;
    const dest = data.find(r => r.sublevel === 1 && r.label === toLabel);
    setData(prev => {
      const copy = structuredClone(prev) as RowData[];
      copy[rowIndex].transfers = (copy[rowIndex].transfers ?? []).map(t => t.id === transferId ? { ...t, to: toLabel, toId: dest?.id } : t);
      return copy;
    });
  };

  const saveTransfers = async (rowIndex: number) => {
    const row = data[rowIndex];
    if (!row || !canEditRowLabel(row)) return;
    setSavingState(prev => ({ ...prev, [rowIndex]: true }));
    const transfersToSave = (row.transfers ?? []).map(({ amount, to }) => ({ amount, to })).filter(t => t.amount > 0 && t.to);
    try {
      const res = await fetch('/api/capex/transfers', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromLabel: row.label, transfers: transfersToSave }),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      setData(prev => { const copy = structuredClone(prev) as RowData[]; copy[rowIndex].transfers = saved; return copy; });
    } catch (e) { console.error(e); }
    finally { setSavingState(prev => ({ ...prev, [rowIndex]: false })); }
  };

  const exportCSV = () => {
    const csv = "origem,destino,valor\n" + edges.map(e => `"${e.from}","${e.to}",${e.amount}`).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
      download: "transferencias.csv",
    });
    a.click(); URL.revokeObjectURL(a.href);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col h-full">

        {/* ══ Toolbar ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm mb-3 gap-3 flex-wrap">

          {/* Esquerda: label + expand/collapse */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">CAPEX (R$ Mil)</span>
            <div className="h-4 w-px bg-slate-200" />
            <button onClick={expandAll}
              className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md px-2.5 py-1 border border-slate-200 transition-colors">
              Abrir Todos
            </button>
            <button onClick={collapseAll}
              className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md px-2.5 py-1 border border-slate-200 transition-colors">
              Fechar Todos
            </button>
          </div>

          {/* Centro: meses editáveis */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Meses editáveis:</span>
            {MONTHS.map((m, idx) => (
              <button key={idx}
                onClick={() => setEditableMonths(prev => {
                  const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n;
                })}
                className={`text-[11px] px-2 py-0.5 rounded-md border font-medium transition-colors ${
                  editableMonths.has(idx)
                    ? "bg-[#00823B] border-[#00823B] text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}>
                {m}
              </button>
            ))}
          </div>

          {/* Direita: ações */}
          <div className="flex items-center gap-2">
            <Link href="/resumo-conclusao"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-[#00823B] hover:bg-[#006830] text-white rounded-lg px-3 py-1.5 transition-colors shadow-sm">
              <BarChart2 size={13} />Dashboard
            </Link>
            <button onClick={() => setMapOpen(true)} disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 transition-colors shadow-sm disabled:opacity-50">
              <ArrowRightLeft size={13} />Mapa de Transferências
            </button>
          </div>
        </div>

        {/* ══ Tabela ═══════════════════════════════════════════════════════════ */}
        <div className="relative border border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-400">
              <Loader2 size={18} className="animate-spin" />Carregando dados…
            </div>
          ) : (
            /* ── Scroll container com scrollbar no topo via CSS ── */
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 #f1f5f9" }}>
              <table className="w-full border-collapse text-sm">

                {/* ── Cabeçalho fixo ── */}
                <thead className="sticky top-0 z-20">
                  <tr>
                    {/* Coluna fixa: nome */}
                    <th className="sticky left-0 z-30 bg-[#005c2b] border-r border-[#004d23] px-4 py-3 text-left text-xs font-bold text-white min-w-[220px] max-w-[260px]">
                      CAPEX (R$ Mil)
                    </th>
                    {/* Meses */}
                    {MONTHS.map((m, idx) => (
                      <th key={idx}
                        className={`border-r border-[#004d23] px-3 py-3 text-center text-xs font-bold text-white min-w-[100px] whitespace-nowrap ${
                          editableMonths.has(idx) ? "bg-[#1a7a4a]" : "bg-[#00823B]"
                        }`}>
                        {m}/25
                        {editableMonths.has(idx) && (
                          <span className="block text-[9px] font-normal text-green-200 mt-0.5">editável</span>
                        )}
                      </th>
                    ))}
                    {/* Melhor Visão */}
                    <th className="bg-[#b8860b] border-r border-amber-700 px-3 py-3 text-center text-xs font-bold text-white min-w-[110px] whitespace-nowrap">
                      MELHOR VISÃO
                    </th>
                    {/* Meta */}
                    <th className="bg-slate-600 border-r border-slate-500 px-3 py-3 text-center text-xs font-bold text-white min-w-[100px] whitespace-nowrap">
                      META
                    </th>
                    {/* Transferência */}
                    <th className="bg-indigo-700 border-r border-indigo-600 px-3 py-3 text-center text-xs font-bold text-white min-w-[120px] whitespace-nowrap">
                      TRANSF. LÍQUIDA
                    </th>
                    {/* Saldo */}
                    <th className="bg-slate-700 border-r border-slate-600 px-3 py-3 text-center text-xs font-bold text-white min-w-[110px] whitespace-nowrap">
                      SALDO
                    </th>
                    {/* Status */}
                    <th className="bg-slate-800 border-r border-slate-700 px-3 py-3 text-center text-xs font-bold text-white min-w-[120px] whitespace-nowrap">
                      STATUS
                    </th>
                    {/* Físico */}
                    <th className="bg-teal-700 px-3 py-3 text-center text-xs font-bold text-white min-w-[110px] whitespace-nowrap">
                      FÍSICO
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleRows.map(row => {
                    const rowIndex    = data.findIndex(d => d.capex === row.capex);
                    const isSubLevel  = row.sublevel === 1;
                    const isPlano     = row.sublevel === undefined;
                    const isExpanded  = isPlano && expandedPlans.has(row.label);
                    const total       = calculateTotal(row.cells);
                    const net         = row.transferNet ?? 0;
                    const metaVal     = row.meta ?? 0;
                    const saldo       = metaVal - total + net;
                    const incomingList = isSubLevel ? (incomingIndex[row.label] ?? []) : [];
                    const canEditRow  = isSubLevel && canEditRowLabel(row);
                    const isSaving    = rowIndex !== -1 ? savingState[rowIndex] === true : false;

                    // Cor de fundo da linha
                    const rowBg = isPlano ? "bg-slate-50" : "bg-white";
                    const rowHover = "hover:bg-green-50/40 transition-colors";

                    return (
                      <tr key={row.capex} className={`${rowBg} ${rowHover}`}>

                        {/* ── Nome (sticky) ── */}
                        <td className={`sticky left-0 z-10 border-r border-slate-200 px-3 py-2.5 ${rowBg} max-w-[260px]`}>
                          <div className="flex items-center gap-1.5">
                            {isPlano && (
                              <button onClick={() => togglePlanExpansion(row.label)}
                                className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center hover:bg-slate-200 transition-colors">
                                <ChevronRight size={13} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                              </button>
                            )}
                            {isSubLevel && <span className="w-1.5 h-1.5 rounded-full bg-[#00823B] flex-shrink-0 ml-1" />}
                            <span className={`text-xs leading-tight truncate ${isPlano ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}>
                              {row.label}
                            </span>
                          </div>
                          {isSubLevel && !canEditRow && (
                            <p className="text-[10px] text-slate-400 mt-0.5 ml-3">Sem permissão</p>
                          )}
                        </td>

                        {/* ── Células dos meses ── */}
                        {row.cells.map((cell, cellIndex) => {
                          const isEditable = isSubLevel && editableMonths.has(cellIndex) && canEditRow;
                          const isLocked   = row.status_capex === 'FINALIZADO';
                          const isPrevisto = editableMonths.has(cellIndex);
                          const val        = typeof cell.value === "number" ? cell.value : 0;

                          return (
                            <td key={cellIndex}
                              className={`border-r border-slate-100 px-2 py-2 text-center min-w-[100px] ${
                                isPrevisto ? "bg-green-50" : "bg-blue-50/60"
                              }`}>
                              {isEditable ? (
                                <input type="number"
                                  value={val === 0 ? "" : val}
                                  onChange={e => handleCellChange(row, rowIndex, cellIndex, e.target.value)}
                                  disabled={isLocked}
                                  placeholder="0"
                                  className={`w-full rounded-md px-1.5 py-0.5 text-center text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-[#00823B] transition-colors ${
                                    isLocked
                                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                      : "bg-white border-[#00823B]/40 text-slate-800 hover:border-[#00823B]"
                                  }`}
                                />
                              ) : (
                                <span className={`text-xs font-medium ${val < 0 ? "text-red-600" : isPrevisto ? "text-emerald-700" : "text-slate-700"}`}>
                                  {fmtN(val)}
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* ── Melhor Visão ── */}
                        <td className="border-r border-amber-100 px-3 py-2 text-center bg-amber-50">
                          <span className="text-xs font-bold text-amber-800">{fmtN(total)}</span>
                        </td>

                        {/* ── Meta ── */}
                        <td className="border-r border-slate-200 px-3 py-2 text-center bg-slate-50">
                          <span className="text-xs font-bold text-slate-600">{fmtN(metaVal)}</span>
                        </td>

                        {/* ── Transferência Líquida ── */}
                        <td className="border-r border-indigo-100 px-2 py-2 text-center bg-indigo-50/50">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`text-xs font-bold ${net > 0 ? "text-emerald-700" : net < 0 ? "text-red-600" : "text-slate-500"}`}>
                              {fmtSg(net)}
                            </span>
                            {isSubLevel && rowIndex !== -1 && data[rowIndex] && (
                              <details className="relative">
                                <summary className="cursor-pointer text-[10px] text-indigo-500 hover:text-indigo-700 select-none list-none flex items-center gap-0.5">
                                  <ArrowRightLeft size={9} />detalhes
                                </summary>
                                <div className="absolute right-0 mt-2 w-[500px] bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-30 text-left">
                                  <div className="grid grid-cols-2 gap-4">
                                    {/* Entradas */}
                                    <div>
                                      <h4 className="text-xs font-semibold text-emerald-700 mb-2">Entradas</h4>
                                      <div className="max-h-48 overflow-auto space-y-1.5">
                                        {incomingList.length > 0 ? incomingList.map((inc, i) => (
                                          <div key={i} className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5">
                                            <span className="text-[11px] text-slate-600 truncate">{inc.from}</span>
                                            <span className="text-[11px] font-bold text-emerald-700 ml-2">+{fmtN(inc.amount)}</span>
                                          </div>
                                        )) : <p className="text-[11px] text-slate-400">Sem entradas.</p>}
                                      </div>
                                    </div>
                                    {/* Saídas */}
                                    <div>
                                      <h4 className="text-xs font-semibold text-red-600 mb-2">Saídas</h4>
                                      <div className="max-h-48 overflow-auto space-y-1.5">
                                        {(data[rowIndex].transfers ?? []).map(t => (
                                          <div key={t.id} className="grid grid-cols-12 gap-1.5 items-end">
                                            <div className="col-span-5">
                                              <label className="text-[10px] text-slate-400">Valor</label>
                                              <input type="number" value={t.amount === 0 ? "" : t.amount}
                                                onChange={e => updateTransferAmount(rowIndex, t.id!, e.target.value)}
                                                className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs disabled:bg-slate-100"
                                                placeholder="0" disabled={!canEditRow || isSaving} />
                                            </div>
                                            <div className="col-span-6">
                                              <label className="text-[10px] text-slate-400">Destino</label>
                                              <select value={t.to ?? ""}
                                                onChange={e => updateTransferTarget(rowIndex, t.id!, e.target.value)}
                                                className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs bg-white disabled:bg-slate-100"
                                                disabled={!canEditRow || isSaving}>
                                                <option value="" disabled>Selecione</option>
                                                {sublevelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                              </select>
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                              <button onClick={() => removeTransfer(rowIndex, t.id!)}
                                                disabled={!canEditRow || isSaving}
                                                className="text-red-400 hover:text-red-600 disabled:opacity-40 text-xs">✕</button>
                                            </div>
                                          </div>
                                        ))}
                                        {!(data[rowIndex].transfers?.length) && <p className="text-[11px] text-slate-400">Sem saídas.</p>}
                                      </div>
                                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                                        <button onClick={() => addTransfer(rowIndex)} disabled={!canEditRow || isSaving}
                                          className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md px-2.5 py-1 disabled:opacity-40">
                                          + Adicionar
                                        </button>
                                        <button onClick={() => saveTransfers(rowIndex)} disabled={!canEditRow || isSaving}
                                          className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 disabled:opacity-40">
                                          {isSaving ? "Salvando…" : "Salvar"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                                    Líquido:{" "}
                                    <span className={`font-bold ${net > 0 ? "text-emerald-700" : net < 0 ? "text-red-600" : "text-slate-700"}`}>
                                      {fmtSg(net)}
                                    </span>
                                  </p>
                                </div>
                              </details>
                            )}
                          </div>
                        </td>

                        {/* ── Saldo ── */}
                        <td className={`border-r border-slate-200 px-3 py-2 text-center ${saldo > 0 ? "bg-emerald-50" : saldo < 0 ? "bg-rose-50" : "bg-slate-50"}`}>
                          <span className={`text-xs font-bold ${saldo > 0 ? "text-emerald-700" : saldo < 0 ? "text-red-600" : "text-slate-500"}`}>
                            {fmtSg(saldo)}
                          </span>
                        </td>

                        {/* ── Status Capex ── */}
                        <td className="border-r border-slate-200 px-2 py-2 text-center bg-white">
                          {isSubLevel && (
                            <div className="group relative flex justify-center">
                              {row.status_capex === 'FINALIZADO' ? (
                                <button onClick={() => handleToggleStatus(row)} disabled={!canEditRow}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                  <CheckCircle2 size={11} />Finalizado
                                </button>
                              ) : (
                                <button onClick={() => handleToggleStatus(row)} disabled={!canEditRow}
                                  className="text-[11px] font-semibold bg-[#00823B] hover:bg-[#006830] text-white px-3 py-1 rounded-full transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
                                  Finalizar
                                </button>
                              )}
                              {row.status_capex === 'FINALIZADO' && canEditRow && (
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 w-max bg-slate-800 text-white text-[10px] rounded-md px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  Clique para reabrir
                                </span>
                              )}
                            </div>
                          )}
                          {isPlano && <StatusBadge status={row.status_capex ?? 'PENDENTE'} />}
                        </td>

                        {/* ── Status Físico ── */}
                        <td className="px-2 py-2 text-center bg-white">
                          {isSubLevel && row.status_capex === 'FINALIZADO' && (
                            <button onClick={() => openPhysicalInputModal(row)} disabled={!canEditRow}
                              className={`inline-flex items-center justify-center gap-1 text-[11px] font-semibold w-full rounded-lg px-2.5 py-1 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                row.status_fisico === 'SIM'
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : row.status_fisico === 'NAO'
                                    ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}>
                              {row.status_fisico === 'SIM' && <CheckCircle2 size={11} />}
                              {row.status_fisico === 'NAO' && <XCircle size={11} />}
                              {(!row.status_fisico || row.status_fisico === 'PENDENTE') && <Database size={11} />}
                              Detalhar
                            </button>
                          )}
                          {isSubLevel && row.status_capex !== 'FINALIZADO' && (
                            <span className="text-[10px] text-slate-400 italic">— Finalize primeiro</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Legenda ── */}
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-3 h-3 rounded bg-blue-50/60 border border-blue-200 inline-block" />
              Meses realizados
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-3 h-3 rounded bg-green-50 border border-green-200 inline-block" />
              Meses editáveis/previstos
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block" />
              Melhor Visão = soma do período
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              Saldo = META − Melhor Visão + Transf. Líquida
            </span>
          </div>
        </div>
      </div>

      {/* ══ Modal Mapa de Transferências ════════════════════════════════════════ */}
      {mapOpen && !isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMapOpen(false)} />
          <div className="relative bg-white w-[92vw] max-w-6xl max-h-[88vh] rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <ArrowRightLeft size={16} className="text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-800">Mapa de Transferências</h4>
              </div>
              <div className="flex items-center gap-2">
                <input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Filtrar subplano…"
                  className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={hideZeros} onChange={e => setHideZeros(e.target.checked)} className="rounded" />
                  Ocultar zeros
                </label>
                <button onClick={exportCSV}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors">
                  Exportar CSV
                </button>
                <button onClick={() => setMapOpen(false)}
                  className="text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-3 py-1.5 transition-colors">
                  Fechar
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-5 pt-3">
              {(["matrix", "list"] as const).map(tab => (
                <button key={tab} onClick={() => setMapTab(tab)}
                  className={`text-xs px-4 py-1.5 rounded-lg border font-medium transition-colors ${
                    mapTab === tab ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}>
                  {tab === "matrix" ? "Matriz" : "Lista"}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto px-5 py-3">
              {mapTab === "matrix" ? (
                <table className="border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white border border-slate-200 px-2 py-1.5 text-left text-slate-600 font-semibold whitespace-nowrap">
                        Origem ↓ / Destino →
                      </th>
                      {filtered.labels.map((dest, j) => (
                        <th key={j} className="border border-slate-200 px-2 py-1.5 text-slate-600 font-medium max-w-[100px] truncate">
                          {dest}
                        </th>
                      ))}
                      <th className="border border-slate-200 px-2 py-1.5 bg-rose-50 text-rose-700 font-bold whitespace-nowrap">Saída total</th>
                      <th className="border border-slate-200 px-2 py-1.5 bg-slate-50 text-slate-700 font-bold whitespace-nowrap">Saldo líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.rows.map((row, iRow) => {
                      const idx    = filtered.idxs[iRow];
                      const out    = map.outgoing[idx];
                      const netRow = map.net[idx];
                      return (
                        <tr key={iRow} className="hover:bg-slate-50">
                          <td className="sticky left-0 z-10 bg-white border border-slate-200 px-2 py-1.5 text-slate-700 font-medium whitespace-nowrap">
                            {filtered.labels[iRow]}
                          </td>
                          {row.map((v, j) => (
                            <td key={j} className={`border border-slate-100 px-2 py-1.5 text-right ${hideZeros && v === 0 ? "text-slate-200" : "text-slate-700"} ${heatClass(v, map.max)}`}>
                              {v === 0 && hideZeros ? "" : fmtN(v)}
                            </td>
                          ))}
                          <td className="border border-slate-200 px-2 py-1.5 text-right font-bold bg-rose-50 text-rose-700">{fmtN(out)}</td>
                          <td className={`border border-slate-200 px-2 py-1.5 text-right font-bold ${netRow >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-rose-50"}`}>
                            {fmtSg(netRow)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 font-bold">
                      <td className="sticky left-0 z-10 bg-slate-50 border border-slate-200 px-2 py-1.5 text-slate-700 text-xs">Entrada total</td>
                      {filtered.labels.map((_, j) => {
                        const idx = filtered.idxs[j];
                        return (
                          <td key={j} className="border border-slate-200 px-2 py-1.5 text-right text-emerald-700 bg-emerald-50">
                            {fmtN(map.incoming[idx])}
                          </td>
                        );
                      })}
                      <td className="border border-slate-200 px-2 py-1.5 bg-slate-50" />
                      <td className="border border-slate-200 px-2 py-1.5 bg-slate-50" />
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-200 px-3 py-2 text-left text-slate-600 font-semibold">Origem</th>
                      <th className="border border-slate-200 px-3 py-2 text-left text-slate-600 font-semibold">Destino</th>
                      <th className="border border-slate-200 px-3 py-2 text-right text-slate-600 font-semibold">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edges
                      .filter(e => {
                        const q = query.trim().toLowerCase();
                        return !q || e.from.toLowerCase().includes(q) || e.to.toLowerCase().includes(q);
                      })
                      .map((e, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="border border-slate-100 px-3 py-1.5 text-slate-700">{e.from}</td>
                          <td className="border border-slate-100 px-3 py-1.5 text-slate-700">{e.to}</td>
                          <td className="border border-slate-100 px-3 py-1.5 text-right font-semibold text-slate-800">{fmtN(e.amount)}</td>
                        </tr>
                      ))}
                    {edges.length === 0 && (
                      <tr><td colSpan={3} className="text-center text-slate-400 py-8">Sem transferências registradas.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal Físico ════════════════════════════════════════════════════════ */}
      {physicalInputModal?.isOpen && (
        <PhysicalInputModal
          isOpen={physicalInputModal.isOpen}
          onClose={() => setPhysicalInputModal(null)}
          onSave={() => {
            setPhysicalInputModal(null);
            fetchData(new AbortController());
          }}
          capexLabel={physicalInputModal.capexItem.label}
          editableMonths={Object.keys(physicalInputModal.financialDataForModal)}
          financialData={physicalInputModal.financialDataForModal}
        />
      )}
    </>
  );
}
