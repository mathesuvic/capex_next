// components/capex-table.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";

interface CellData {
  value: number | string;
  type: "realizado" | "previsto";
}

interface TransferEntry {
  id?: number;
  amount: number;
  to?: string;
  toId?: number;
}

interface RowData {
  id?: number;
  label: string;
  sublevel?: number; // undefined = Plano (topo), 1 = subplano
  color?: string;
  cells: CellData[];
  computed?: boolean;
  meta?: number;
  transfers?: TransferEntry[]; // saídas desta linha
  transferNet?: number;
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Parse inicial dos meses editáveis vindos da env (1–12 -> converte para índice 0–11)
const parseEnvEditableMonths = () =>
  (process.env.NEXT_PUBLIC_CAPEX_EDITABLE_MONTHS ?? "9,10,11,12")
    .split(",")
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((m) => Number.isFinite(m) && m >= 0 && m < 12);

// Fallback local (usado só se o fetch da API falhar)
const fallbackData: RowData[] = [
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
      { value: 127582, type: "previsto" },
      { value: 105648, type: "previsto" },
      { value: 88102, type: "previsto" },
    ],
  },
  {
    label: "1.1 - Subestações",
    sublevel: 1,
    meta: 350000,
    transfers: [],
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
      { value: 25023, type: "previsto" },
      { value: 37235, type: "previsto" },
      { value: 41286, type: "previsto" },
    ],
  },
  {
    label: "1.2 - Linhas de Transmissão",
    sublevel: 1,
    meta: 600000,
    transfers: [],
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
      { value: 89033, type: "previsto" },
      { value: 53883, type: "previsto" },
      { value: 28637, type: "previsto" },
    ],
  },
  {
    label: "1.3 - Distribuição",
    sublevel: 1,
    meta: 120000,
    transfers: [],
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
      { value: 12920, type: "previsto" },
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
      { value: 359, type: "previsto" },
      { value: 9935, type: "previsto" },
      { value: 8897, type: "previsto" },
    ],
  },
  {
    label: "2.1 - Projeto Sistema Técnico BRR",
    sublevel: 1,
    meta: 0,
    transfers: [],
    cells: Array.from({ length: 12 }, () => ({ value: 0, type: "realizado" })),
  },
  {
    label: "2.2 - Projeto Operação EMS",
    sublevel: 1,
    meta: 800,
    transfers: [],
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
      { value: 38, type: "previsto" },
      { value: 29, type: "previsto" },
      { value: 62, type: "previsto" },
    ],
  },
  {
    label: "2.3 - Cybersecurity",
    sublevel: 1,
    meta: 20000,
    transfers: [],
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
      { value: 11, type: "previsto" },
      { value: 9906, type: "previsto" },
      { value: 8835, type: "previsto" },
    ],
  },
];

// ===== Helpers =====

function calculateTotal(rowCells: CellData[]) {
  return rowCells.reduce((sum, c) => sum + (typeof c.value === "number" ? c.value : 0), 0);
}

const formatNumber = (num: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(num);
const formatSigned = (n: number) => `${n > 0 ? "+" : ""}${formatNumber(n)}`;

// ✅ FIX: normalizeLabel precisa existir ANTES de ser usada (e antes dos useEffects que a usam)
function normalizeLabel(input: string) {
  return (input ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, " ") // colapsa múltiplos espaços
    .trim()
    .toLowerCase();
}

// ===== Transferências (líquida) =====

const sumOutgoing = (row: RowData) =>
  (row.transfers ?? []).reduce((s, t) => s + (Number.isFinite(t.amount) ? t.amount : 0), 0);

function buildIncomingIndex(rows: RowData[]) {
  const sublabels = new Set(rows.filter((r) => r.sublevel === 1).map((r) => r.label));
  const temp: Record<string, Record<string, number>> = {};
  rows.forEach((r) => {
    (r.transfers ?? []).forEach((t) => {
      if (!t?.to || !Number.isFinite(t.amount)) return;
      if (!sublabels.has(t.to)) return;
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

/**
 * computeDisplay agora recebe `editableMonths` (Set<number>) para forçar meses
 * marcados como editáveis a serem tratados como "previsto" nas linhas de subnível.
 */
function computeDisplay(rows: RowData[], editableMonths: Set<number>) {
  const res = rows.map((r) => ({ ...r, cells: r.cells.map((c) => ({ ...c })) }));

  // Índice dos subplanos
  const subIndex = new Map<string, number>();
  res.forEach((r, i) => {
    if (r.sublevel === 1) subIndex.set(r.label, i);
  });

  // Outgoing e incoming para calcular líquido
  const outgoing = res.map(sumOutgoing);
  const incoming = Array(res.length).fill(0);
  res.forEach((r) => {
    (r.transfers ?? []).forEach((t) => {
      if (!t?.to) return;
      const idx = subIndex.get(t.to);
      if (idx !== undefined && Number.isFinite(t.amount)) incoming[idx] += t.amount;
    });
  });
  const net = res.map((_, i) => incoming[i] - outgoing[i]);

  // Agrega planos e anota transferNet
  let i = 0;
  while (i < res.length) {
    const row = res[i];
    if (row.sublevel === undefined) {
      const agg = Array(12).fill(0);
      const monthIsPrevisto = Array(12).fill(false) as boolean[];
      let metaSum = 0;
      let netSum = 0;
      let j = i + 1;

      while (j < res.length && res[j].sublevel === 1) {
        // soma por mês e marca se alguma célula do mês é "previsto"
        res[j].cells.forEach((cell, idx) => {
          agg[idx] += typeof cell.value === "number" ? cell.value : 0;
          if (cell.type === "previsto") monthIsPrevisto[idx] = true;
        });
        metaSum += res[j].meta ?? 0;
        netSum += net[j];
        res[j] = { ...res[j], transferNet: net[j] };
        j++;
      }

      // Se o mês foi marcado como editável globalmente, considera previsto na visão agregada
      for (let mi = 0; mi < 12; mi++) {
        if (editableMonths.has(mi)) monthIsPrevisto[mi] = true;
      }

      res[i] = {
        ...row,
        computed: true,
        meta: metaSum,
        transferNet: netSum,
        cells: agg.map((v, idx) => ({
          value: v,
          type: monthIsPrevisto[idx] ? ("previsto" as const) : ("realizado" as const),
        })),
      };

      i = j;
    } else {
      // Para linhas de subnível, se o mês estiver marcado como editável forçamos o tipo para "previsto"
      res[i] = {
        ...res[i],
        cells: res[i].cells.map((c, idx) => ({
          value: c.value,
          type: editableMonths.has(idx) ? "previsto" : c.type,
        })),
      };
      i++;
    }
  }

  return res;
}

// ===== Mapa de Transferências =====

function buildTransferMatrix(rows: RowData[]) {
  const labels = rows.filter((r) => r.sublevel === 1).map((r) => r.label);
  const idxMap = new Map(labels.map((l, i) => [l, i] as const));
  const n = labels.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  const outgoing = Array(n).fill(0);
  const incoming = Array(n).fill(0);

  rows.forEach((r) => {
    if (r.sublevel !== 1) return;
    const fromIdx = idxMap.get(r.label)!;
    (r.transfers ?? []).forEach((t) => {
      if (!t?.to || !Number.isFinite(t.amount)) return;
      const toIdx = idxMap.get(t.to);
      if (toIdx == null) return;
      matrix[fromIdx][toIdx] += t.amount;
      outgoing[fromIdx] += t.amount;
      incoming[toIdx] += t.amount;
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

type PermissionsResponse =
  | { isAdmin: true; allowedLabels: "ALL" }
  | { isAdmin: false; allowedLabels: string[] };

export function CapexTable() {
  const [data, setData] = useState<RowData[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapTab, setMapTab] = useState<"matrix" | "list">("matrix");
  const [query, setQuery] = useState("");
  const [hideZeros, setHideZeros] = useState(true);

  // Estado para meses editáveis (índices 0–11). Inicializa a partir da env.
  const [editableMonths, setEditableMonths] = useState<Set<number>>(() => new Set(parseEnvEditableMonths()));

  // Permissões do usuário
  const [isAdmin, setIsAdmin] = useState(false);
  const [allowedLabels, setAllowedLabels] = useState<Set<string>>(() => new Set());

  // Carrega dados do CAPEX
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/capex", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Falha ao buscar /api/capex");

        const json = (await res.json()) as RowData[];
        setData(json);
      } catch (e) {
        if ((e as any)?.name === "AbortError") return;
        console.error(e);
        setData(fallbackData);
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  // Carrega permissões do usuário logado (para habilitar/desabilitar edição no front)
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/me/permissions", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Falha ao buscar /api/me/permissions");

        const json = (await res.json()) as PermissionsResponse;

        if (json.isAdmin && json.allowedLabels === "ALL") {
          setIsAdmin(true);
          setAllowedLabels(new Set());
        } else {
          setIsAdmin(false);
          // ✅ normaliza para bater com canEditRowLabel() que usa normalizeLabel(row.label)
          setAllowedLabels(new Set(json.allowedLabels.map(normalizeLabel)));
        }
      } catch (e) {
        if ((e as any)?.name === "AbortError") return;

        // Se falhar, por segurança: não dá permissão a ninguém no front
        console.error(e);
        setIsAdmin(false);
        setAllowedLabels(new Set());
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  const subplans = useMemo(
    () => data.filter((r) => r.sublevel === 1).map((r) => ({ label: r.label, id: r.id })),
    [data]
  );
  const sublevelOptions = subplans.map((s) => s.label);
  const incomingIndex = buildIncomingIndex(data);
  const displayData = computeDisplay(data, editableMonths);

  // Toggle visual para meses editáveis (cria novo Set para forçar re-render)
  const toggleEditableMonth = (idx: number) => {
    // ✅ Se você quiser que só admin possa escolher meses editáveis, descomente:
    // if (!isAdmin) return;

    setEditableMonths((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const canEditRowLabel = (row: RowData) => {
    if (isAdmin) return true;
    // Compara o label da linha (normalizado) com os labels permitidos (já normalizados)
    return allowedLabels.has(normalizeLabel(row.label));
  };

  // Atualiza célula e persiste para subplanos em meses editáveis, respeitando permissão por linha
  const handleCellChange = async (row: RowData, rowIndex: number, cellIndex: number, value: string) => {
    const numValue = value === "" ? 0 : Number.parseFloat(value) || 0;

    // ✅ Bloqueio no front (UX). Backend também deve bloquear.
    if (!canEditRowLabel(row)) return;

    // Atualiza estado otimista
    setData((prev) => {
      const copy = structuredClone(prev) as RowData[];
      if (!copy[rowIndex]) return prev;
      copy[rowIndex].cells[cellIndex].value = numValue;
      return copy;
    });

    // Persistir apenas para subplano, mês editável e com permissão
    if (row.sublevel === 1 && editableMonths.has(cellIndex)) {
      try {
        const month = cellIndex + 1;
        const res = await fetch(`/api/capex/values`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            month,
            value: numValue,
            label: row.label,
          }),
        });

        // Se backend negar, ideal é reverter (aqui deixei aviso simples)
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          console.warn("PUT /api/capex/values falhou:", res.status, j);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // CRUD transferências (saídas) na linha (agora também respeita permissão)
  const addTransfer = async (rowIndex: number) => {
    const row = data[rowIndex];
    if (!row?.label) return;

    if (!canEditRowLabel(row)) return;

    const dest = subplans.find((s) => s.label && s.label !== row.label) || subplans[0];
    if (!dest?.label) return;

    try {
      const res = await fetch(`/api/capex/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromLabel: row.label,
          toLabel: dest.label,
          amount: 0,
        }),
      });

      if (!res.ok) throw new Error("Falha ao criar transferência na API");

      const newTransfer = await res.json();

      setData((prev) => {
        const copy = structuredClone(prev) as RowData[];
        const currentTransfers = copy[rowIndex].transfers ?? [];
        copy[rowIndex].transfers = [
          ...currentTransfers,
          {
            id: newTransfer.id,
            amount: newTransfer.amount,
            to: dest.label,
          },
        ];
        return copy;
      });
    } catch (e) {
      console.error("Erro ao adicionar transferência:", e);
    }
  };

  const updateTransferAmount = (rowIndex: number, tIndex: number, value: string) => {
    const row = data[rowIndex];
    if (!row) return;
    if (!canEditRowLabel(row)) return;

    const amount = value === "" ? 0 : Number.parseFloat(value) || 0;

    setData((prev) => {
      const copy = structuredClone(prev) as RowData[];
      const list = [...(copy[rowIndex].transfers ?? [])];
      list[tIndex] = { ...list[tIndex], amount };
      copy[rowIndex].transfers = list;
      return copy;
    });
  };

  const updateTransferTarget = (rowIndex: number, tIndex: number, toLabel: string) => {
    const row = data[rowIndex];
    if (!row) return;
    if (!canEditRowLabel(row)) return;

    const dest = data.find((r) => r.sublevel === 1 && r.label === toLabel);
    setData((prev) => {
      const copy = structuredClone(prev) as RowData[];
      const list = [...(copy[rowIndex].transfers ?? [])];
      list[tIndex] = { ...list[tIndex], to: toLabel, toId: dest?.id };
      copy[rowIndex].transfers = list;
      return copy;
    });
  };

  const removeTransfer = async (rowIndex: number, tIndex: number) => {
    const row = data[rowIndex];
    if (!row) return;
    if (!canEditRowLabel(row)) return;

    const t = data[rowIndex]?.transfers?.[tIndex];
    if (!t?.id) {
      console.warn("Sem id da transferência para deletar");
      return;
    }

    const snapshot = structuredClone(data) as RowData[];

    setData((prev) => {
      const copy = structuredClone(prev) as RowData[];
      const list = [...(copy[rowIndex].transfers ?? [])];
      list.splice(tIndex, 1);
      copy[rowIndex].transfers = list;
      return copy;
    });

    try {
      const res = await fetch(`/api/capex/transfers?id=${t.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao deletar transferência");
    } catch (e) {
      console.error("Erro ao deletar transferência:", e);
      setData(snapshot);
    }
  };

  // Dados do mapa (memo)
  const map = useMemo(() => buildTransferMatrix(data), [data]);

  // Filtro por texto no mapa
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { labels: map.labels, rows: map.matrix, idxs: map.labels.map((_, i) => i) };
    const idxs = map.labels
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => l.toLowerCase().includes(q))
      .map(({ i }) => i);
    const rows = idxs.map((i) => idxs.map((j) => map.matrix[i][j]));
    const labels = idxs.map((i) => map.labels[i]);
    return { labels, rows, idxs };
  }, [map, query]);

  // Lista consolidada origem->destino
  const edges = useMemo(() => {
    const list: { from: string; to: string; amount: number }[] = [];
    map.labels.forEach((from, i) => {
      map.labels.forEach((to, j) => {
        const v = map.matrix[i][j];
        if (v > 0) list.push({ from, to, amount: v });
      });
    });
    return list.sort((a, b) => b.amount - a.amount);
  }, [map]);

  const exportCSV = () => {
    const header = "origem,destino,valor\n";
    const body = edges.map((e) => `"${e.from}","${e.to}",${e.amount}`).join("\n");
    const csv = header + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transferencias.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loading = data.length === 0;

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-lg">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <h3 className="text-sm font-semibold text-slate-800">CAPEX (R$ Mil)</h3>
        <div className="flex items-center gap-3">
          {/* Controle de meses editáveis (chips) */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-600 mr-2">Meses editáveis:</span>
            {MONTHS.map((m, idx) => {
              const active = editableMonths.has(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleEditableMonth(idx)}
                  className={`text-xs px-2 py-1 rounded border ${
                    active ? "bg-[#e6f7f0] border-[#00823B] text-[#00663a]" : "bg-white hover:bg-slate-50"
                  }`}
                  title={`${m}/25`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setMapOpen(true)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1.5"
            disabled={loading}
          >
            Mapa de Transferências
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-slate-600">Carregando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#00823B] text-white">
                <th className="sticky left-0 z-20 bg-[#00823B] border border-[#004d23] px-4 py-3 text-left font-semibold min-w-64">
                  CAPEX (R$ Mil)
                </th>
                {MONTHS.map((m, idx) => (
                  <th
                    key={idx}
                    className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-32 text-sm"
                  >
                    {m}/25
                  </th>
                ))}
                <th className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-40 bg-[#FFB81C] text-slate-900 font-bold">
                  MELHOR VISÃO
                </th>
                <th className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-40 bg-slate-100 text-slate-900 font-bold">
                  META
                </th>
                <th className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-56 bg-indigo-50 text-slate-900 font-bold">
                  TRANSFERÊNCIA (líquida)
                </th>
                <th className="border border-[#004d23] px-3 py-3 text-center font-semibold min-w-48 bg-sky-50 text-slate-900 font-bold">
                  SALDO A DISTRIBUIR
                </th>
              </tr>
            </thead>

            <tbody>
              {displayData.map((row, rowIndex) => {
                const total = calculateTotal(row.cells);
                const isSubLevel = row.sublevel === 1;
                const isPlano = row.sublevel === undefined;
                const net = row.transferNet ?? 0;
                const metaVal = row.meta ?? 0;
                const saldo = metaVal - total + net;

                const incomingList = incomingIndex[row.label] ?? [];
                const outgoingList = data[rowIndex]?.transfers ?? [];
                const incomingCount = incomingList.length;
                const outgoingCount = outgoingList.length;

                // ✅ permissões por linha
                const canEditRow = isSubLevel && canEditRowLabel(row);

                return (
                  <tr
                    key={rowIndex}
                    className={`${
                      row.color || (isSubLevel ? "bg-white" : "bg-slate-50")
                    } border-b border-slate-200 hover:bg-slate-50 transition-colors`}
                  >
                    <td
                      className={`sticky left-0 z-10 border border-slate-200 px-4 py-3 font-medium ${
                        row.color || (isSubLevel ? "bg-white" : "bg-slate-50")
                      } ${isSubLevel ? "pl-8 text-slate-700" : "text-slate-900"}`}
                    >
                      {row.label}
                      {isSubLevel && !canEditRow && (
                        <div className="mt-1 text-[11px] text-slate-500">Sem permissão para editar esta linha</div>
                      )}
                    </td>

                    {row.cells.map((cell, cellIndex) => {
                      // EDITÁVEL se for subnível, mês estiver marcado, e usuário tiver permissão na linha
                      const isEditable = isSubLevel && editableMonths.has(cellIndex) && canEditRow;

                      return (
                        <td
                          key={cellIndex}
                          className={`border border-slate-200 px-3 py-3 text-center min-w-32 ${
                            !editableMonths.has(cellIndex) ? "bg-[#e6f0ff] text-slate-900" : "bg-white"
                          }`}
                        >
                          {isEditable ? (
                            <input
                              type="number"
                              value={cell.value === 0 ? "" : cell.value}
                              onChange={(e) => handleCellChange(row, rowIndex, cellIndex, e.target.value)}
                              className="w-full bg-[#e6f7f0] border border-[#00823B] rounded px-2 py-1 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00823B] focus:bg-white"
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-sm font-medium text-slate-700">
                              {formatNumber(typeof cell.value === "number" ? cell.value : 0)}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="border border-slate-200 px-3 py-3 text-center font-bold text-slate-900 bg-[#fff3e0] min-w-40">
                      <span className="text-sm">{formatNumber(total)}</span>
                    </td>

                    <td className="border border-slate-200 px-3 py-3 text-center font-bold text-slate-900 bg-slate-100 min-w-40">
                      <span className="text-sm">{formatNumber(metaVal)}</span>
                    </td>

                    {/* TRANSFERÊNCIA (líquida) */}
                    <td className="border border-slate-200 px-3 py-3 text-center bg-indigo-50 min-w-56">
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
                            Entradas: <span className="text-emerald-700 font-medium">+{incomingCount}</span> | Saídas:{" "}
                            <span className="text-red-700 font-medium">{outgoingCount}</span>
                          </span>
                        )}

                        {isSubLevel && (
                          <details className="relative mt-1">
                            <summary className="cursor-pointer text-xs text-indigo-700 underline decoration-dotted select-none">
                              detalhes
                            </summary>

                            <div className="absolute right-0 mt-2 w-[520px] bg-white border border-slate-200 rounded shadow p-3 z-30 text-left">
                              <div className="grid grid-cols-2 gap-4">
                                {/* ENTRADAS (somente leitura) */}
                                <div>
                                  <h4 className="text-xs font-semibold text-emerald-700 mb-2">
                                    Entradas (por origem)
                                  </h4>
                                  <div className="max-h-56 overflow-auto space-y-2">
                                    {incomingList.length > 0 ? (
                                      incomingList.map((inc, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between border border-emerald-100 rounded px-2 py-1"
                                        >
                                          <span className="text-xs text-slate-700">{inc.from}</span>
                                          <span className="text-xs font-semibold text-emerald-700">
                                            +{formatNumber(inc.amount)}
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-xs text-slate-500">Sem entradas.</p>
                                    )}
                                  </div>
                                </div>

                                {/* SAÍDAS (editável apenas se tiver permissão) */}
                                <div>
                                  <h4 className="text-xs font-semibold text-red-700 mb-2">Saídas</h4>

                                  {!canEditRow && (
                                    <p className="text-xs text-slate-500 mb-2">
                                      Você não tem permissão para editar saídas desta linha.
                                    </p>
                                  )}

                                  <div className="max-h-56 overflow-auto space-y-2">
                                    {(data[rowIndex].transfers ?? []).map((t, tIdx) => (
                                      <div key={tIdx} className="grid grid-cols-12 gap-2 items-end">
                                        <div className="col-span-5">
                                          <label className="text-[11px] text-slate-500">Valor (saída)</label>
                                          <input
                                            type="number"
                                            value={t.amount === 0 ? "" : t.amount}
                                            onChange={(e) => updateTransferAmount(rowIndex, tIdx, e.target.value)}
                                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm disabled:bg-slate-100"
                                            placeholder="0"
                                            disabled={!canEditRow}
                                          />
                                        </div>

                                        <div className="col-span-6">
                                          <label className="text-[11px] text-slate-500">Destino (subplano)</label>
                                          <select
                                            value={t.to ?? ""}
                                            onChange={(e) => updateTransferTarget(rowIndex, tIdx, e.target.value)}
                                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-white disabled:bg-slate-100"
                                            disabled={!canEditRow}
                                          >
                                            <option value="" disabled>
                                              Selecione um subplano
                                            </option>
                                            {sublevelOptions.map((opt) => (
                                              <option key={opt} value={opt}>
                                                {opt}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        <div className="col-span-1">
                                          <button
                                            onClick={() => removeTransfer(rowIndex, tIdx)}
                                            className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                            disabled={!canEditRow}
                                          >
                                            x
                                          </button>
                                        </div>
                                      </div>
                                    ))}

                                    {(!data[rowIndex].transfers || data[rowIndex].transfers!.length === 0) && (
                                      <p className="text-xs text-slate-500">Sem saídas.</p>
                                    )}
                                  </div>

                                  <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs text-slate-700">
                                      Total saídas:{" "}
                                      <span className="font-semibold text-red-700">
                                        {formatNumber(
                                          (data[rowIndex].transfers ?? []).reduce((s, t) => s + (t.amount || 0), 0)
                                        )}
                                      </span>
                                    </span>

                                    <button
                                      onClick={() => addTransfer(rowIndex)}
                                      className="bg-indigo-600 text-white text-xs rounded px-2 py-1 hover:bg-indigo-700 disabled:opacity-50"
                                      disabled={!canEditRow}
                                    >
                                      Adicionar saída
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 text-xs text-slate-700 border-t pt-2">
                                Líquido (entradas − saídas):{" "}
                                <span
                                  className={`font-semibold ${
                                    net > 0 ? "text-emerald-700" : net < 0 ? "text-red-700" : "text-slate-900"
                                  }`}
                                >
                                  {formatSigned(net)}
                                </span>
                              </div>
                            </div>
                          </details>
                        )}

                        {isPlano && (
                          <p className="mt-1 text-[11px] text-slate-500">
                            Soma das transferências líquidas dos subplanos.
                          </p>
                        )}
                      </div>
                    </td>

                    {/* SALDO A DISTRIBUIR = META − MELHOR VISÃO + TRANSFERÊNCIA (líquida) */}
                    <td
                      className={`border border-slate-200 px-3 py-3 text-center min-w-48 ${
                        saldo > 0 ? "bg-emerald-50" : saldo < 0 ? "bg-rose-50" : "bg-sky-50"
                      }`}
                    >
                      <span
                        className={`text-sm font-bold ${
                          saldo > 0 ? "text-emerald-700" : saldo < 0 ? "text-red-700" : "text-slate-900"
                        }`}
                      >
                        {formatSigned(saldo)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 space-y-2">
        <p className="text-sm text-slate-600">
          <span className="inline-block w-3 h-3 bg-[#e6f0ff] border border-[#0066CC] rounded mr-2"></span>
          Valores em <strong>azul</strong> são dados de meses não-editáveis (imutáveis no front)
        </p>
        <p className="text-sm text-slate-600">
          <span className="inline-block w-3 h-3 bg-[#e6f7f0] border border-[#00823B] rounded mr-2"></span>
          Valores em <strong>verde</strong> são meses marcados como <strong>editáveis/previstos</strong> (você pode
          selecionar quais meses acima)
        </p>
        <p className="text-sm text-slate-600">
          <span className="inline-block w-3 h-3 bg-indigo-50 border border-indigo-200 rounded mr-2"></span>
          <strong>Transferência (líquida)</strong> = entradas − saídas. <strong>Saldo a Distribuir</strong> = META −
          MELHOR VISÃO + Transferência.
        </p>
      </div>

      {/* Modal do Mapa */}
      {mapOpen && !loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMapOpen(false)} />

          <div className="relative bg-white w-[90vw] max-w-6xl max-h-[85vh] rounded-lg border shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h4 className="text-sm font-semibold text-slate-800">Mapa de Transferências</h4>

              <div className="flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filtrar por subplano..."
                  className="text-sm border rounded px-2 py-1"
                />

                <label className="text-xs text-slate-700 flex items-center gap-1">
                  <input type="checkbox" checked={hideZeros} onChange={(e) => setHideZeros(e.target.checked)} />
                  Ocultar zeros
                </label>

                <button
                  onClick={exportCSV}
                  className="text-xs bg-slate-100 hover:bg-slate-200 rounded px-2 py-1 border"
                >
                  Exportar CSV
                </button>

                <button
                  onClick={() => setMapOpen(false)}
                  className="text-xs bg-slate-800 text-white hover:bg-slate-900 rounded px-2 py-1"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="px-4 pt-3">
              <div className="flex items-center gap-4 mb-3">
                <button
                  onClick={() => setMapTab("matrix")}
                  className={`text-xs px-3 py-1.5 rounded border ${
                    mapTab === "matrix" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  Matriz
                </button>

                <button
                  onClick={() => setMapTab("list")}
                  className={`text-xs px-3 py-1.5 rounded border ${
                    mapTab === "list" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  Lista
                </button>
              </div>

              {mapTab === "matrix" ? (
                <div className="overflow-auto max-h-[65vh] pb-4">
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white border px-2 py-1 text-xs text-slate-700 text-left">
                          Origem ↓ / Destino →
                        </th>
                        {filtered.labels.map((dest, j) => (
                          <th key={j} className="border px-2 py-1 text-xs text-slate-700">
                            {dest}
                          </th>
                        ))}
                        <th className="border px-2 py-1 text-xs font-semibold bg-slate-50">Saída total</th>
                        <th className="border px-2 py-1 text-xs font-semibold bg-slate-50">Saldo líquido</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.rows.map((row, iRow) => {
                        const idx = filtered.idxs[iRow];
                        const out = map.outgoing[idx];
                        const netRow = map.net[idx];

                        return (
                          <tr key={iRow} className="hover:bg-slate-50">
                            <td className="sticky left-0 z-10 bg-white border px-2 py-1 text-xs text-slate-700">
                              {filtered.labels[iRow]}
                            </td>

                            {row.map((v, j) => (
                              <td
                                key={j}
                                className={`border px-2 py-1 text-xs text-right align-middle ${
                                  hideZeros && v === 0 ? "text-slate-300" : ""
                                } ${heatClass(v, map.max)}`}
                              >
                                {v === 0 && hideZeros ? "" : formatNumber(v)}
                              </td>
                            ))}

                            <td className="border px-2 py-1 text-xs text-right font-semibold bg-slate-50 text-red-700">
                              {formatNumber(out)}
                            </td>

                            <td
                              className={`border px-2 py-1 text-xs text-right font-semibold bg-slate-50 ${
                                netRow >= 0 ? "text-emerald-700" : "text-red-700"
                              }`}
                            >
                              {formatSigned(netRow)}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Linha de totais de entrada */}
                      <tr>
                        <td className="sticky left-0 z-10 bg-slate-50 border px-2 py-1 text-xs font-semibold">
                          Entrada total
                        </td>
                        {filtered.labels.map((_, j) => {
                          const idx = filtered.idxs[j];
                          const inc = map.incoming[idx];
                          return (
                            <td
                              key={j}
                              className="border px-2 py-1 text-xs text-right font-semibold bg-slate-50 text-emerald-700"
                            >
                              {formatNumber(inc)}
                            </td>
                          );
                        })}
                        <td className="border px-2 py-1 text-xs bg-slate-50" />
                        <td className="border px-2 py-1 text-xs bg-slate-50" />
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="max-h-[65vh] overflow-auto pb-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border px-2 py-1 text-xs text-left">Origem</th>
                        <th className="border px-2 py-1 text-xs text-left">Destino</th>
                        <th className="border px-2 py-1 text-xs text-right">Valor</th>
                      </tr>
                    </thead>

                    <tbody>
                      {edges
                        .filter((e) => {
                          const q = query.trim().toLowerCase();
                          if (!q) return true;
                          return e.from.toLowerCase().includes(q) || e.to.toLowerCase().includes(q);
                        })
                        .map((e, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="border px-2 py-1 text-xs">{e.from}</td>
                            <td className="border px-2 py-1 text-xs">{e.to}</td>
                            <td className="border px-2 py-1 text-xs text-right">{formatNumber(e.amount)}</td>
                          </tr>
                        ))}

                      {edges.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center text-xs text-slate-500 py-4">
                            Sem transferências.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
