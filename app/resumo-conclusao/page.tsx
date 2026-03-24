// app/resumo-conclusao/page.tsx
"use client"

import { useMemo, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, XAxis, YAxis, Legend, LabelList, Tooltip
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Wallet, Target, HardHat, LandPlot, ArrowLeft, RefreshCw,
  XCircle, ChevronRight, Home, AlertTriangle, CheckCircle2,
  Minus, BarChart3, PieChart as PieChartIcon, TableIcon, Zap,
  ArrowUpDown, ArrowUp, ArrowDown, Search, X, SlidersHorizontal
} from "lucide-react"

// ─── Tipos ───────────────────────────────────────────────────────────────────
type StatusCapex  = "PENDENTE" | "FINALIZADO" | "PARCIAL"
type StatusFisico = "SIM" | "NAO" | "PENDENTE"
type SortKey      = "tipo" | "natureza" | "plano_text" | "plano_investimento" | "meta" | "peso" | "status_capex" | "status_fisico"
type SortDir      = "asc" | "desc" | null

interface RawDataRow {
  id: string; meta: number
  status_capex: StatusCapex; status_fisico: StatusFisico
  tipo: string; natureza: string; plano_text: string; plano_investimento: string
}
interface ApiResponse {
  ok: boolean; error?: string; updatedAt: string; rawData: RawDataRow[]
}

// ─── Hierarquia ──────────────────────────────────────────────────────────────
const HIERARCHY_KEYS = ['tipo', 'natureza', 'plano_text', 'plano_investimento'] as const
type HierarchyKey = typeof HIERARCHY_KEYS[number]
const HIERARCHY_LABELS: Record<HierarchyKey, string> = {
  tipo: 'Tipo', natureza: 'Natureza', plano_text: 'Plano', plano_investimento: 'Subplano'
}

// ─── Paleta fixa ─────────────────────────────────────────────────────────────
const COLOR_GREEN = "#16a34a"
const COLOR_AMBER = "#f59e0b"
const COLOR_SLATE = "#9ca3af"
const COLOR_RED   = "#ef4444"

const PIE_CAPEX: Record<string, string> = {
  Finalizado: COLOR_GREEN,
  Parcial:    COLOR_AMBER,
  Pendente:   COLOR_SLATE,
}
const PIE_FISICO: Record<string, string> = {
  SIM:               COLOR_GREEN,
  NAO:               COLOR_RED,
  "Pendente Fisico": COLOR_SLATE,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtBRL  = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
const fmtCpct = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(v)
const fmtPct  = (v: number, t: number) => t > 0 ? `${((v / t) * 100).toFixed(1)}%` : "0%"
const pctNum  = (v: number, t: number) => t > 0 ? (v / t) * 100 : 0

// ─── Rótulo Pizza ─────────────────────────────────────────────────────────────
const PieLabel = (p: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, fill } = p
  if (!p || percent < 0.04) return null
  const r   = innerRadius + (outerRadius - innerRadius) * 0.55
  const x   = cx + r * Math.cos(-midAngle * Math.PI / 180)
  const y   = cy + r * Math.sin(-midAngle * Math.PI / 180)
  const txt = `${(percent * 100).toFixed(0)}%`
  const w   = txt.length > 3 ? 34 : 28
  return (
    <g>
      <rect x={x - w / 2} y={y - 10} width={w} height={20} fill={fill} rx={5} stroke="#fff" strokeWidth={2} />
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>{txt}</text>
    </g>
  )
}

// ─── Rótulo Barra ─────────────────────────────────────────────────────────────
const BarLabel = (p: any) => {
  const { x, y, height, value, payload } = p
  if (!value || typeof x !== 'number' || typeof y !== 'number' || !payload) return null
  const total   = payload.totalMeta || 0
  const done    = payload.finalizadoMeta || 0
  const pct     = total > 0 ? done / total : 0
  const isSmall = pct < 0.12
  const w  = value.length > 3 ? 36 : 30
  const cx = isSmall ? x + w / 2 + 5 : x - w / 2 - 5
  const cy = y + (height ?? 0) / 2
  return (
    <g>
      <rect x={cx - w / 2} y={cy - 10} width={w} height={20} fill={COLOR_GREEN} rx={6} stroke="#fff" strokeWidth={2} />
      <text x={cx} y={cy} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>{value}</text>
    </g>
  )
}

// ─── Tooltip Barra ────────────────────────────────────────────────────────────
const RichBarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d   = payload[0]?.payload
  if (!d) return null
  const pct = d.totalMeta > 0 ? ((d.finalizadoMeta / d.totalMeta) * 100).toFixed(1) : '0'
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-4 min-w-[220px]">
      <p className="font-semibold text-gray-800 text-sm mb-3 pb-2 border-b border-gray-100 truncate">{d.name}</p>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Meta Total</span>
          <span className="font-mono font-medium">{fmtBRL(d.totalMeta)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLOR_GREEN }} />
            Realizado
          </span>
          <span className="font-mono font-medium" style={{ color: COLOR_GREEN }}>{fmtBRL(d.finalizadoMeta)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
            Pendente
          </span>
          <span className="font-mono font-medium text-gray-400">{fmtBRL(d.pendenteMeta)}</span>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500 font-medium">Conclusão</span>
            <span className="font-bold" style={{ color: COLOR_GREEN }}>{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLOR_GREEN }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Badge Status ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: StatusCapex | StatusFisico }) {
  const cfg: { [k: string]: { cls: string; icon: any; label: string } } = {
    FINALIZADO: { cls: "bg-green-100 text-green-700 border-green-200",    icon: CheckCircle2,  label: "Finalizado" },
    PARCIAL:    { cls: "bg-orange-100 text-orange-600 border-orange-200", icon: AlertTriangle, label: "Parcial"    },
    PENDENTE:   { cls: "bg-gray-100 text-gray-500 border-gray-200",       icon: Minus,         label: "Pendente"   },
    SIM:        { cls: "bg-green-100 text-green-700 border-green-200",    icon: CheckCircle2,  label: "Sim"        },
    NAO:        { cls: "bg-red-100 text-red-600 border-red-200",          icon: XCircle,       label: "Não"        },
  }
  const c = cfg[status]
  if (!c) return <Badge variant="outline">{status}</Badge>
  const Icon = c.icon
  return (
    <Badge variant="outline" className={`${c.cls} font-medium gap-1 text-xs whitespace-nowrap`}>
      <Icon className="h-3 w-3" />{c.label}
    </Badge>
  )
}

// ─── Gauge compacto inline ────────────────────────────────────────────────────
function GaugeCard({ pct, label, sublabelA, sublabelB }: {
  pct: number; label: string; sublabelA: string; sublabelB: string
}) {
  const color = pct >= 80 ? COLOR_GREEN : pct >= 40 ? COLOR_AMBER : COLOR_RED
  const r     = 38
  const circ  = 2 * Math.PI * r
  const off   = circ * (1 - Math.min(pct, 100) / 100)
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col items-center gap-1">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide self-start">{label}</p>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          transform="rotate(-90 48 48)" style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="48" y="44" textAnchor="middle" fontSize="16" fontWeight="800" fill={color}>{pct.toFixed(0)}%</text>
        <text x="48" y="59" textAnchor="middle" fontSize="8" fill="#9ca3af">{label.toLowerCase()}</text>
      </svg>
      <p className="text-[10px] text-gray-400 text-center leading-snug">
        {sublabelA}<br /><span className="text-gray-300">de</span> {sublabelB}
      </p>
    </div>
  )
}

// ─── Card de Pizza horizontal ─────────────────────────────────────────────────
function PieCard({
  title, subtitle, data, colorMap, total, countLabel
}: {
  title: string; subtitle: string
  data: { name: string; value: number }[]
  colorMap: Record<string, string>
  total: number
  countLabel: string
}) {
  const displayName = (n: string) =>
    n === "NAO" ? "Não" : n === "Pendente Fisico" ? "Pendente" : n

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <p className="font-bold text-sm text-gray-800 mb-0.5">{title}</p>
      <p className="text-[11px] text-gray-400 mb-3">{subtitle}</p>
      <div className="flex items-center gap-3">
        {/* Pizza */}
        <div className="flex-shrink-0 w-[100px] h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%"
                innerRadius="32%" outerRadius="76%"
                dataKey="value" strokeWidth={2} stroke="#fff"
                labelLine={false} label={PieLabel}>
                {data.map(e => <Cell key={e.name} fill={colorMap[e.name]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 11 }}
                formatter={(v: any, n: string) => [`${v} · ${fmtPct(v, total)}`, displayName(n)]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legenda */}
        <div className="flex-1 space-y-2 min-w-0">
          {data.map(d => (
            <div key={d.name}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="flex items-center gap-1.5 text-xs min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colorMap[d.name] }} />
                  <span className="text-gray-600 font-medium truncate">{displayName(d.name)}</span>
                </span>
                <span className="text-xs font-bold ml-1 flex-shrink-0"
                  style={{ color: colorMap[d.name] }}>
                  {fmtPct(d.value, total)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${total > 0 ? (d.value / total) * 100 : 0}%`, backgroundColor: colorMap[d.name] }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{d.value} {countLabel}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────
function KpiCards({ summary }: { summary: any }) {
  const p1 = pctNum(summary.capexFinalizadoCount, summary.totalSubplans)
  const p2 = pctNum(summary.capexFinalizadoMeta,  summary.totalMeta)
  const p3 = pctNum(summary.fisicoSimCount,        summary.totalFisico)
  const p4 = pctNum(summary.fisicoSimMeta,         summary.totalMetaFisico)
  const dynColor = (p: number) => p >= 80 ? COLOR_GREEN : p >= 40 ? COLOR_AMBER : COLOR_RED

  const cards = [
    {
      label: "Conclusão Financeira", sub: "Subplanos finalizados",
      value: `${summary.capexFinalizadoCount} / ${summary.totalSubplans}`,
      pct: p1, icon: Wallet,
      iconBg: "#dcfce7", iconColor: COLOR_GREEN,
      barColor: COLOR_GREEN, txtColor: COLOR_GREEN,
      detail: `${p1.toFixed(1)}% do escopo`, borderTop: COLOR_GREEN,
    },
    {
      label: "Volume Financeiro", sub: "Meta executada (R$)",
      value: fmtCpct(summary.capexFinalizadoMeta),
      pct: p2, icon: Target,
      iconBg: "#ffedd5", iconColor: "#ea580c",
      barColor: dynColor(p2), txtColor: dynColor(p2),
      detail: `de ${fmtCpct(summary.totalMeta)}`, borderTop: COLOR_AMBER,
    },
    {
      label: "Entrega Física", sub: "Projetos entregues",
      value: `${summary.fisicoSimCount} / ${summary.totalFisico}`,
      pct: p3, icon: HardHat,
      iconBg: "#dbeafe", iconColor: "#2563eb",
      barColor: dynColor(p3), txtColor: dynColor(p3),
      detail: `${p3.toFixed(1)}% dos finalizados`, borderTop: "#3b82f6",
    },
    {
      label: "Volume Físico", sub: "Meta dos projetos entregues",
      value: fmtCpct(summary.fisicoSimMeta),
      pct: p4, icon: LandPlot,
      iconBg: "#f3e8ff", iconColor: "#9333ea",
      barColor: dynColor(p4), txtColor: dynColor(p4),
      detail: `de ${fmtCpct(summary.totalMetaFisico)}`, borderTop: "#9333ea",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-5"
          style={{ borderTop: `4px solid ${card.borderTop}` }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{card.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
            </div>
            <div className="rounded-xl p-2.5" style={{ backgroundColor: card.iconBg }}>
              <card.icon className="h-4 w-4" style={{ color: card.iconColor }} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-gray-800 mb-3">{card.value}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">{card.detail}</span>
              <span className="font-bold" style={{ color: card.txtColor }}>{card.pct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${card.pct}%`, backgroundColor: card.barColor }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    </div>
  )
}

// ─── Cabeçalho Ordenável ──────────────────────────────────────────────────────
function SortableHead({ col, label, currentSort, onSort, className = "" }: {
  col: SortKey; label: string
  currentSort: { key: SortKey | null; dir: SortDir }
  onSort: (k: SortKey) => void
  className?: string
}) {
  const active = currentSort.key === col
  return (
    <TableHead
      className={`text-xs font-bold uppercase tracking-wide cursor-pointer select-none hover:bg-green-50 transition-colors ${active ? "text-green-700" : "text-gray-500"} ${className}`}
      onClick={() => onSort(col)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {active && currentSort.dir === 'asc'  && <ArrowUp   className="h-3 w-3 text-green-600" />}
        {active && currentSort.dir === 'desc' && <ArrowDown  className="h-3 w-3 text-green-600" />}
        {!active && <ArrowUpDown className="h-3 w-3 text-gray-300" />}
      </div>
    </TableHead>
  )
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function DashboardResumoConclusaoPage() {
  const [data,          setData         ] = useState<ApiResponse | null>(null)
  const [loading,       setLoading      ] = useState(true)
  const [error,         setError        ] = useState<string | null>(null)
  const [drilldownPath, setDrilldownPath] = useState<{ level: HierarchyKey; value: string }[]>([])
  const [sort,          setSort         ] = useState<{ key: SortKey | null; dir: SortDir }>({ key: null, dir: null })
  const [searchText,    setSearchText   ] = useState("")
  const [filterCapex,   setFilterCapex  ] = useState<string>("todos")
  const [filterFisico,  setFilterFisico ] = useState<string>("todos")
  const [showFilters,   setShowFilters  ] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        const res  = await fetch('/api/capex/getsummary', { signal: ctrl.signal, cache: 'no-store' })
        const json = await res.json()
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'Falha ao carregar')
        setData(json)
      } catch (e: any) {
        if (e.name !== 'AbortError') setError(e?.message)
      } finally {
        setLoading(false)
      }
    })()
    return () => ctrl.abort()
  }, [])

  const handleSort = useCallback((key: SortKey) => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return { key: null, dir: null }
    })
  }, [])

  const processed = useMemo(() => {
    if (!data?.rawData) return null
    let cur = data.rawData
    drilldownPath.forEach(s => { cur = cur.filter(r => r[s.level] === s.value) })

    const idx         = drilldownPath.length
    const groupingKey = HIERARCHY_KEYS[Math.min(idx, HIERARCHY_KEYS.length - 1)]
    const canDrill    = idx < HIERARCHY_KEYS.length - 1

    const summary = cur.reduce((acc, row) => {
      acc.totalSubplans++; acc.totalMeta += row.meta
      if      (row.status_capex === 'FINALIZADO') { acc.capexFinalizadoCount++; acc.capexFinalizadoMeta += row.meta }
      else if (row.status_capex === 'PARCIAL')    { acc.capexParcialCount++;    acc.capexParcialMeta   += row.meta }
      else                                         { acc.capexPendenteCount++;   acc.capexPendenteMeta  += row.meta }
      if (row.status_capex === 'FINALIZADO') {
        acc.totalFisico++; acc.totalMetaFisico += row.meta
        if      (row.status_fisico === 'SIM') { acc.fisicoSimCount++; acc.fisicoSimMeta += row.meta }
        else if (row.status_fisico === 'NAO') { acc.fisicoNaoCount++; acc.fisicoNaoMeta += row.meta }
        else                                   { acc.fisicoPendCount++; acc.fisicoPendMeta += row.meta }
      }
      return acc
    }, {
      totalSubplans: 0, totalMeta: 0,
      capexFinalizadoCount: 0, capexFinalizadoMeta: 0,
      capexParcialCount: 0,    capexParcialMeta: 0,
      capexPendenteCount: 0,   capexPendenteMeta: 0,
      totalFisico: 0,          totalMetaFisico: 0,
      fisicoSimCount: 0,       fisicoSimMeta: 0,
      fisicoNaoCount: 0,       fisicoNaoMeta: 0,
      fisicoPendCount: 0,      fisicoPendMeta: 0,
    } as any)

    const map = new Map<string, any>()
    cur.forEach(row => {
      const k = row[groupingKey]
      if (!map.has(k)) map.set(k, { name: k, totalMeta: 0, finalizadoMeta: 0, pendenteMeta: 0 })
      const g = map.get(k)!
      g.totalMeta += row.meta
      if (row.status_capex === 'FINALIZADO') g.finalizadoMeta += row.meta
      else g.pendenteMeta += row.meta
    })

    const chartData = [...map.values()]
      .map(item => {
        const p = item.totalMeta > 0 ? Math.round((item.finalizadoMeta / item.totalMeta) * 100) : 0
        return {
          ...item,
          shortName:    item.name.length > 26 ? item.name.slice(0, 26) + '…' : item.name,
          pctFormatted: p > 0 ? `${p}%` : ''
        }
      })
      .sort((a, b) => b.totalMeta - a.totalMeta)

    const capexPie = [
      { name: "Finalizado", value: summary.capexFinalizadoCount },
      { name: "Parcial",    value: summary.capexParcialCount    },
      { name: "Pendente",   value: summary.capexPendenteCount   },
    ].filter(d => d.value > 0)

    const fisicoPie = [
      { name: "SIM",             value: summary.fisicoSimCount  },
      { name: "NAO",             value: summary.fisicoNaoCount  },
      { name: "Pendente Fisico", value: summary.fisicoPendCount },
    ].filter(d => d.value > 0)

    return {
      summary, chartData, capexPie, fisicoPie, tableData: cur, canDrill, groupingKey,
      levelLabel:      HIERARCHY_LABELS[groupingKey],
      globalPct:       pctNum(summary.capexFinalizadoMeta, summary.totalMeta),
      globalFisicoPct: pctNum(summary.fisicoSimMeta, summary.totalMetaFisico),
    }
  }, [data, drilldownPath])

  const tableRows = useMemo(() => {
    if (!processed) return []
    const totalMeta = processed.summary.totalMeta || 1
    let rows = processed.tableData.map(row => ({ ...row, peso: (row.meta / totalMeta) * 100 }))
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      rows = rows.filter(r =>
        r.tipo.toLowerCase().includes(q) ||
        r.natureza.toLowerCase().includes(q) ||
        r.plano_text.toLowerCase().includes(q) ||
        r.plano_investimento.toLowerCase().includes(q)
      )
    }
    if (filterCapex  !== 'todos') rows = rows.filter(r => r.status_capex  === filterCapex)
    if (filterFisico !== 'todos') rows = rows.filter(r => r.status_fisico === filterFisico)
    if (sort.key && sort.dir) {
      rows = [...rows].sort((a, b) => {
        let va: any = a[sort.key as keyof typeof a]
        let vb: any = b[sort.key as keyof typeof b]
        if (sort.key === 'peso') { va = a.peso; vb = b.peso }
        if (typeof va === 'string') va = va.toLowerCase()
        if (typeof vb === 'string') vb = vb.toLowerCase()
        if (va < vb) return sort.dir === 'asc' ? -1 : 1
        if (va > vb) return sort.dir === 'asc' ?  1 : -1
        return 0
      })
    }
    return rows
  }, [processed, searchText, filterCapex, filterFisico, sort])

  const handleBarClick = (d: any) => {
    if (processed?.canDrill)
      setDrilldownPath([...drilldownPath, { level: processed.groupingKey, value: d.name }])
  }
  const clearFilters = () => {
    setSearchText(""); setFilterCapex("todos"); setFilterFisico("todos"); setSort({ key: null, dir: null })
  }
  const hasActiveFilters = searchText || filterCapex !== 'todos' || filterFisico !== 'todos'

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">

      {/* ── Navbar ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow"
              style={{ backgroundColor: COLOR_GREEN }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-gray-800 tracking-wide">CapEx Portal</span>
              <span className="text-[11px] text-gray-400">Neoenergia · Coelba</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400 font-medium">
            <Link href="/home" className="hover:text-gray-700 transition-colors">Início</Link>
            <span className="hover:text-gray-700 cursor-pointer transition-colors">Relatórios</span>
            <span className="cursor-pointer pb-0.5 font-semibold border-b-2"
              style={{ color: COLOR_GREEN, borderColor: COLOR_GREEN }}>
              Painel Executivo
            </span>
          </nav>
          <div className="flex items-center gap-3">
            {loading && <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />}
            <Link href="/home">
              <Button variant="outline" size="sm"
                className="gap-2 h-9 text-sm font-medium rounded-lg border-gray-200 hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition-all">
                <ArrowLeft className="h-4 w-4" />Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 space-y-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-2xl text-white px-10 py-10 shadow-lg"
          style={{ background: "linear-gradient(135deg, #15803d 0%, #16a34a 50%, #166534 100%)" }}>
          <div className="absolute right-0 top-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute right-24 bottom-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  ● Painel Executivo
                </span>
                {data?.updatedAt && (
                  <span className="bg-white/10 text-green-100 text-xs px-3 py-1 rounded-full border border-white/10">
                    Atualizado em {new Date(data.updatedAt).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2">CAPEX &amp; Físico 📊</h1>
              <p className="text-green-100 text-base max-w-lg">
                Acompanhe a evolução financeira e física dos projetos de capital. Clique nas barras para detalhar por nível.
              </p>
            </div>
            {processed && (
              <div className="flex gap-4 shrink-0 flex-wrap">
                {[
                  { label: "Subplanos",   value: processed.summary.totalSubplans        },
                  { label: "Finalizados", value: processed.summary.capexFinalizadoCount },
                  { label: "Pendentes",   value: processed.summary.capexPendenteCount   },
                ].map(kpi => (
                  <div key={kpi.label}
                    className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 text-center border border-white/10 min-w-[90px]">
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-green-100 text-xs mt-1">{kpi.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-red-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Falha ao carregar dados</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {loading && !data && <LoadingSkeleton />}

        {data && processed && (
          <>
            {/* ── Breadcrumb ── */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setDrilldownPath([])}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${drilldownPath.length === 0
                    ? 'text-white shadow-sm'
                    : 'bg-white text-gray-400 hover:bg-green-50 hover:text-green-700 border border-gray-200'}`}
                style={drilldownPath.length === 0 ? { backgroundColor: COLOR_GREEN } : {}}
              >
                <Home className="h-3.5 w-3.5" />Todos os Níveis
              </button>
              {drilldownPath.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                  <button
                    onClick={() => setDrilldownPath(drilldownPath.slice(0, i + 1))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${i === drilldownPath.length - 1
                        ? 'text-white shadow-sm'
                        : 'bg-white text-gray-400 hover:bg-green-50 hover:text-green-700 border border-gray-200'}`}
                    style={i === drilldownPath.length - 1 ? { backgroundColor: COLOR_GREEN } : {}}
                  >
                    {s.value}
                  </button>
                </div>
              ))}
            </div>

            {/* ── KPIs ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" style={{ color: COLOR_GREEN }} />
                  Indicadores de Desempenho
                </h2>
                <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">
                  {processed.summary.totalSubplans} subplanos
                </span>
              </div>
              <KpiCards summary={processed.summary} />
            </section>

            {/* ── Gráficos ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" style={{ color: COLOR_GREEN }} />
                  Análise Visual · {processed.levelLabel}
                </h2>
              </div>

              {/*
                ┌─────────────────────────────────┬─────────────────────┐
                │  Card de Barras — h-full        │  Gauge Fin│Gauge Fis│
                │  flex-col: header + chart flex-1│  ─────────────────  │
                │                                 │  PieCard Financeiro │
                │                                 │  ─────────────────  │
                │                                 │  PieCard Físico     │
                └─────────────────────────────────┴─────────────────────┘
                Ambas as colunas usam h-full / stretch para ficarem iguais
              */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-stretch">

                {/* ── Card de Barras — estica para preencher a altura da coluna direita ── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-4 flex-shrink-0">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">Progresso por {processed.levelLabel}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {processed.canDrill ? "↓ Clique em uma barra para detalhar" : "Nível máximo atingido"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                      {processed.chartData.length} {processed.levelLabel.toLowerCase()}
                    </span>
                  </div>

                  {/* ── Chart expande para preencher o restante do card ── */}
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={processed.chartData} layout="vertical"
                        margin={{ top: 4, left: 0, right: 52, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                        <XAxis type="number" hide />
                        <YAxis
                          type="category" dataKey="shortName"
                          tickLine={false} axisLine={false} width={140}
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                        />
                        <Tooltip content={<RichBarTooltip />} cursor={{ fill: '#f9fafb' }} />
                        <Legend
                          verticalAlign="top" align="right" iconType="circle"
                          wrapperStyle={{ fontSize: '11px', paddingBottom: '14px' }}
                          formatter={v => v === "Meta Finalizada" ? "Realizado" : "Pendente"}
                        />
                        <Bar dataKey="finalizadoMeta" name="Meta Finalizada"
                          fill={COLOR_GREEN} stackId="a"
                          cursor={processed.canDrill ? 'pointer' : 'default'}
                          onClick={handleBarClick} radius={[3, 0, 0, 3]} />
                        <Bar dataKey="pendenteMeta" name="Meta Pendente"
                          fill="#e5e7eb" stackId="a"
                          cursor={processed.canDrill ? 'pointer' : 'default'}
                          onClick={handleBarClick} radius={[0, 4, 4, 0]}>
                          <LabelList dataKey="pctFormatted" content={<BarLabel />} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* ── Coluna direita ── */}
                <div className="flex flex-col gap-3">

                  {/* Linha 1: dois gauges lado a lado */}
                  <div className="grid grid-cols-2 gap-3">
                    <GaugeCard
                      pct={processed.globalPct}
                      label="Financeiro"
                      sublabelA={fmtCpct(processed.summary.capexFinalizadoMeta)}
                      sublabelB={fmtCpct(processed.summary.totalMeta)}
                    />
                    <GaugeCard
                      pct={processed.globalFisicoPct}
                      label="Físico"
                      sublabelA={`${processed.summary.fisicoSimCount} entregues`}
                      sublabelB={`${processed.summary.totalFisico}`}
                    />
                  </div>

                  {/* Pizza Financeiro */}
                  <PieCard
                    title="Status Financeiro"
                    subtitle="Composição por quantidade"
                    data={processed.capexPie}
                    colorMap={PIE_CAPEX}
                    total={processed.summary.totalSubplans}
                    countLabel="subplanos"
                  />

                  {/* Pizza Físico */}
                  <PieCard
                    title="Status Físico"
                    subtitle="Base: projetos financ. concluídos"
                    data={processed.fisicoPie}
                    colorMap={PIE_FISICO}
                    total={processed.summary.totalFisico}
                    countLabel="projetos"
                  />

                </div>
              </div>
            </section>

            {/* ── Tabela ── */}
            <section>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <TableIcon className="h-5 w-5" style={{ color: COLOR_GREEN }} />
                  Detalhamento
                  <span className="text-sm font-normal text-gray-400">
                    · {tableRows.length} de {processed.tableData.length} registros
                  </span>
                  {tableRows.length !== processed.tableData.length && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                      Filtrado
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}
                      className="h-8 text-xs gap-1 text-gray-400 hover:text-gray-700">
                      <X className="h-3 w-3" />Limpar filtros
                    </Button>
                  )}
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setShowFilters(v => !v)}
                    className={`h-8 text-xs gap-1.5 rounded-lg transition-all border-gray-200
                      ${showFilters ? 'text-white border-green-600' : 'hover:border-green-300 hover:text-green-700 hover:bg-green-50'}`}
                    style={showFilters ? { backgroundColor: COLOR_GREEN } : {}}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />Filtros
                    {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                  </Button>
                </div>
              </div>

              {showFilters && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        placeholder="Buscar tipo, natureza, plano ou subplano…"
                        value={searchText} onChange={e => setSearchText(e.target.value)}
                        className="pl-8 h-9 text-xs rounded-lg border-gray-200"
                      />
                      {searchText && (
                        <button onClick={() => setSearchText("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2">
                          <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-700" />
                        </button>
                      )}
                    </div>
                    <Select value={filterCapex} onValueChange={setFilterCapex}>
                      <SelectTrigger className="h-9 text-xs rounded-lg border-gray-200">
                        <SelectValue placeholder="Status Financeiro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status financeiros</SelectItem>
                        <SelectItem value="FINALIZADO">✅ Finalizado</SelectItem>
                        <SelectItem value="PARCIAL">⚠️ Parcial</SelectItem>
                        <SelectItem value="PENDENTE">⏳ Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterFisico} onValueChange={setFilterFisico}>
                      <SelectTrigger className="h-9 text-xs rounded-lg border-gray-200">
                        <SelectValue placeholder="Status Físico" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status físicos</SelectItem>
                        <SelectItem value="SIM">✅ Sim (Entregue)</SelectItem>
                        <SelectItem value="NAO">❌ Não</SelectItem>
                        <SelectItem value="PENDENTE">⏳ Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="max-h-[480px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-100">
                        <SortableHead col="tipo"               label="Tipo"       currentSort={sort} onSort={handleSort} className="pl-5 w-[80px]" />
                        <SortableHead col="natureza"           label="Natureza"   currentSort={sort} onSort={handleSort} className="w-[120px]" />
                        <SortableHead col="plano_text"         label="Plano"      currentSort={sort} onSort={handleSort} />
                        <SortableHead col="plano_investimento" label="Subplano"   currentSort={sort} onSort={handleSort} />
                        <SortableHead col="meta"               label="Meta (R$)"  currentSort={sort} onSort={handleSort} className="text-right w-[120px]" />
                        <SortableHead col="peso"               label="Peso"       currentSort={sort} onSort={handleSort} className="text-center w-[100px]" />
                        <SortableHead col="status_capex"       label="Financeiro" currentSort={sort} onSort={handleSort} className="text-center w-[110px]" />
                        <SortableHead col="status_fisico"      label="Físico"     currentSort={sort} onSort={handleSort} className="text-center w-[90px] pr-5" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-16 text-gray-400">
                            <div className="flex flex-col items-center gap-2">
                              <Search className="h-8 w-8 text-gray-200" />
                              <span className="text-sm">Nenhum registro encontrado</span>
                              <Button variant="ghost" size="sm" onClick={clearFilters}
                                className="text-xs mt-1 text-green-700 hover:text-green-800">
                                Limpar filtros
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : tableRows.map((item, idx) => {
                        const isHigh = item.peso >= 10
                        const isMid  = item.peso >= 5
                        return (
                          <TableRow key={item.id ?? idx}
                            className={`text-xs transition-colors hover:bg-green-50/60 ${idx % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
                            <TableCell className="pl-5 font-medium text-gray-400 whitespace-nowrap">{item.tipo}</TableCell>
                            <TableCell className="text-gray-400">{item.natureza}</TableCell>
                            <TableCell className="font-medium max-w-[180px] truncate text-gray-700" title={item.plano_text}>
                              {item.plano_text}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-gray-400" title={item.plano_investimento}>
                              {item.plano_investimento}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold tabular-nums text-gray-700">
                              {fmtBRL(item.meta)}
                            </TableCell>
                            <TableCell className="text-center px-3">
                              <div className="flex flex-col items-center gap-1">
                                <span className="tabular-nums text-xs font-semibold"
                                  style={{ color: isHigh ? COLOR_GREEN : isMid ? COLOR_AMBER : COLOR_SLATE }}>
                                  {item.peso.toFixed(1)}%
                                </span>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden max-w-[60px]">
                                  <div className="h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(item.peso * 3, 100)}%`, backgroundColor: COLOR_GREEN, opacity: 0.65 }} />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <StatusBadge status={item.status_capex} />
                            </TableCell>
                            <TableCell className="text-center pr-5">
                              {item.status_capex === 'FINALIZADO'
                                ? <StatusBadge status={item.status_fisico} />
                                : <span className="text-gray-200">—</span>}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                {tableRows.length > 0 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/80">
                    <p className="text-xs text-gray-400">
                      Soma das metas:{" "}
                      <span className="font-semibold text-gray-700">{fmtBRL(tableRows.reduce((s, r) => s + r.meta, 0))}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Peso total:{" "}
                      <span className="font-semibold text-gray-700">{tableRows.reduce((s, r) => s + r.peso, 0).toFixed(1)}%</span>
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: COLOR_GREEN }}>
              <Zap className="w-2.5 h-2.5 text-white" />
            </div>
            © 2025 Neoenergia · Coelba. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLOR_GREEN }} />
              Sistema operacional
            </span>
            <span className="hidden md:block">v5.0.0</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
