"use client"

import { useMemo, useEffect, useState } from "react"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  Cell, Pie, PieChart, ResponsiveContainer,
  XAxis, YAxis, LabelList, Tooltip,
} from "recharts"
import { Badge }  from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tag, XIcon } from "lucide-react"

// ─── Cores Neoenergia ─────────────────────────────────────────────────────────
const COR_VERDE     = "#00823b"
const COR_AMARELO   = "#ffb81c"
const COR_AZUL      = "#0066cc"
const COR_LARANJA   = "#f59e0b"
const COR_ESMERALDA = "#10b981"
const COR_ROXO      = "#8b5cf6"
const COR_TOTAL     = "#1e293b"
const PIE_COLORS    = [COR_VERDE, COR_AMARELO, COR_AZUL, COR_LARANJA, COR_ESMERALDA, COR_ROXO]

// ─── Tipos ────────────────────────────────────────────────────────────────────
type MonthKey = "jan"|"fev"|"mar"|"abr"|"mai"|"jun"|"jul"|"ago"|"set"|"out"|"nov"|"dez"

type RequestItem = {
  id                  : string
  type                : string
  natureza            : string
  desc_fisico         : string
  justificativa       : string
  investmentPlan      : string
  totalValue          : number
  status              : StatusFront
  requestDate         : string
  requestedBy         : string
  carimbo             : { id: number; nome: string } | null
  monthlyDistribution : Record<MonthKey, number>
}

type StatusFront     = "approved" | "pending" | "rejected"
type SummaryResponse = {
  ok        : boolean
  error    ?: string
  updatedAt : string
  requests  : RequestItem[]
}

type WaterfallEntry = {
  name    : string
  base    : number   // barra invisível (offset)
  value   : number   // barra visível
  total   : number   // valor real acumulado (para tooltip)
  isTotal : boolean
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const MONTH_KEYS: MonthKey[] = [
  "jan","fev","mar","abr","mai","jun",
  "jul","ago","set","out","nov","dez",
]
const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value)

const formatShort = (value: number) => {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `R$${(value / 1_000).toFixed(0)}k`
  return `R$${value}`
}

const getStatusBadge = (status: StatusFront) => {
  const map: Record<StatusFront, { label: string; className: string }> = {
    approved: { label: "Aprovado",  className: "bg-green-600 hover:bg-green-700"   },
    pending : { label: "Pendente",  className: "bg-yellow-500 hover:bg-yellow-600" },
    rejected: { label: "Rejeitado", className: "bg-red-600 hover:bg-red-700"       },
  }
  const { label, className } = map[status] ?? { label: "N/A", className: "bg-gray-500" }
  return <Badge className={`${className} text-white`}>{label}</Badge>
}

// ─── Label do Pie ─────────────────────────────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, outerRadius, name, percent }: any) => {
  const RADIAN = Math.PI / 180
  const radius = outerRadius + 32
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.04) return null
  return (
    <text x={x} y={y} textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central" fontSize={12} fill="#374151">
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  )
}

// ─── Label das barras horizontais ────────────────────────────────────────────
const renderBarLabel = (props: any) => {
  const { x, y, width, height, value } = props
  if (!value || value === 0) return null
  const inside = width > 90
  return (
    <text
      x={inside ? x + width - 8 : x + width + 8}
      y={y + height / 2}
      textAnchor={inside ? "end" : "start"}
      dominantBaseline="central"
      fontSize={11} fontWeight={500}
      fill={inside ? "#ffffff" : "#374151"}
    >
      {formatShort(value)}
    </text>
  )
}

// ─── Tooltip customizado para o Waterfall ────────────────────────────────────
const WaterfallTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const entry: WaterfallEntry = payload[0]?.payload
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-slate-800 mb-1">{entry.name}</p>
      <p className="text-slate-600">
        {entry.isTotal ? "Total acumulado" : "Valor"}:{" "}
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(entry.isTotal ? entry.total : entry.value)}
        </span>
      </p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DashboardResumoSolicitacoesPage() {
  const [statusFilter,  setStatusFilter ] = useState<"all" | StatusFront>("all")
  const [data,          setData         ] = useState<SummaryResponse | null>(null)
  const [loading,       setLoading      ] = useState(true)
  const [error,         setError        ] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<Record<string, string | null>>({})

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        setLoading(true); setError(null); setActiveFilters({})
        const qs  = new URLSearchParams({ status: statusFilter })
        const res = await fetch(`/api/solicitacao-recursos/resumo?${qs}`, { signal: controller.signal })
        const json = (await res.json().catch(() => ({}))) as SummaryResponse
        if (!res.ok || !json?.ok) throw new Error(json?.error || `Falha (${res.status})`)
        setData(json)
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e?.message || "Erro ao carregar resumo")
      } finally { setLoading(false) }
    })()
    return () => controller.abort()
  }, [statusFilter])

  // ── Filtros ────────────────────────────────────────────────────────────────
  const handleFilterChange = (key: string, value: string) => {
    const newVal = value === "all" ? null : value
    setActiveFilters(prev => ({
      ...Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key && k !== "month")),
      [key]: prev[key] === newVal ? null : newVal,
    }))
  }

  // ── Processamento ──────────────────────────────────────────────────────────
  const processedData = useMemo(() => {
    if (!data) return null

    const filterOptions = {
      types   : [...new Set(data.requests.map(r => r.type).filter(Boolean))].sort(),
      natures : [...new Set(data.requests.map(r => r.natureza).filter(Boolean))].sort(),
      plans   : [...new Set(data.requests.map(r => r.investmentPlan).filter(Boolean))].sort(),
      carimbos: [...new Set(
        data.requests.filter(r => r.carimbo)
          .map(r => JSON.stringify({ id: r.carimbo!.id, nome: r.carimbo!.nome }))
      )].map(s => JSON.parse(s) as { id: number; nome: string }),
    }

    const filteredRequests = data.requests.filter(req =>
      Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true
        if (key === "month") return req.monthlyDistribution[value.toLowerCase() as MonthKey] > 0
        if (key === "carimbo") return req.carimbo?.nome === value
        const keyMap: Record<string, keyof RequestItem> = {
          type: "type", nature: "natureza", plan: "investmentPlan",
        }
        return req[keyMap[key]] === value
      })
    )

    const stats = filteredRequests.reduce(
      (acc, r) => {
        acc.total += r.totalValue; acc.count++
        if      (r.status === "approved") { acc.approved += r.totalValue; acc.approvedCount++ }
        else if (r.status === "pending")  { acc.pending  += r.totalValue; acc.pendingCount++  }
        else                              { acc.rejected += r.totalValue; acc.rejectedCount++ }
        return acc
      },
      { total:0, approved:0, pending:0, rejected:0, count:0, approvedCount:0, pendingCount:0, rejectedCount:0 }
    )

    const monthlyData = MONTH_NAMES.map((name, idx) => ({
      name : name.slice(0, 3),
      key  : MONTH_KEYS[idx],
      total: filteredRequests.reduce((s, req) => s + (req.monthlyDistribution[MONTH_KEYS[idx]] || 0), 0),
    }))

    const reduceToMap = (key: keyof RequestItem) =>
      filteredRequests.reduce((map, req) => {
        const k = (req[key] as string) || "N/A"
        map.set(k, (map.get(k) || 0) + req.totalValue)
        return map
      }, new Map<string, number>())

    const planData   = Array.from(reduceToMap("investmentPlan")).map(([name, total]) => ({ name, total }))
    const typeData   = Array.from(reduceToMap("type")).map(([name, value]) => ({ name, value }))
    const natureData = Array.from(reduceToMap("natureza")).map(([name, total]) => ({ name, total }))

    // ── Waterfall (Gráfico Ponte) para Carimbo ───────────────────────────────
    const carimboMap = filteredRequests.reduce((map, req) => {
      const k = req.carimbo?.nome ?? "Sem carimbo"
      map.set(k, (map.get(k) || 0) + req.totalValue)
      return map
    }, new Map<string, number>())

    const carimboRows = Array.from(carimboMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)

    // Monta dados waterfall: base = acumulado anterior, value = valor da fatia
    let accumulated = 0
    const waterfallData: WaterfallEntry[] = carimboRows.map(row => {
      const entry: WaterfallEntry = {
        name   : row.name,
        base   : accumulated,
        value  : row.total,
        total  : accumulated + row.total,
        isTotal: false,
      }
      accumulated += row.total
      return entry
    })

    // Coluna TOTAL: base = 0, value = acumulado total
    const grandTotal = accumulated
    waterfallData.push({
      name   : "TOTAL",
      base   : 0,
      value  : grandTotal,
      total  : grandTotal,
      isTotal: true,
    })

    return {
      stats, monthlyData, planData, typeData,
      natureData, waterfallData, carimboRows, grandTotal,
      filteredRequests, filterOptions,
    }
  }, [data, activeFilters])

  const hasActiveFilters = Object.values(activeFilters).some(v => v !== null)

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-slate-50 p-4 md:p-6">
      <div className="max-w-[90rem] mx-auto space-y-6">

        {/* ── Cabeçalho ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de Recursos</h1>
            <p className="text-muted-foreground">Visualize e analise as solicitações de recursos</p>
            {data?.updatedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Atualizado em: {new Date(data.updatedAt).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
          <Button asChild variant="outline">
            <a href="/gerenciar-solicitacao">Voltar ao Gerenciamento</a>
          </Button>
        </div>

        {loading && <Card><CardContent className="pt-6"><p className="text-muted-foreground">Carregando...</p></CardContent></Card>}
        {error   && <Card><CardContent className="pt-6"><p className="text-red-600">Erro: {error}</p></CardContent></Card>}

        {!loading && !error && data && processedData && (
          <>
            {/* ── Filtros ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Filtros Gerais</CardTitle></CardHeader>
                <CardContent className="flex gap-3 flex-wrap">
                  {(["all","approved","pending","rejected"] as const).map(s => (
                    <Button key={s} variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
                      {{ all:"Todos", approved:"Aprovados", pending:"Pendentes", rejected:"Rejeitados" }[s]}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Filtros Adicionais</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Select value={activeFilters.type || "all"} onValueChange={v => handleFilterChange("type", v)}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      {processedData.filterOptions.types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={activeFilters.nature || "all"} onValueChange={v => handleFilterChange("nature", v)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Natureza..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Naturezas</SelectItem>
                      {processedData.filterOptions.natures.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={activeFilters.plan || "all"} onValueChange={v => handleFilterChange("plan", v)}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Plano..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Planos</SelectItem>
                      {processedData.filterOptions.plans.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={activeFilters.carimbo || "all"} onValueChange={v => handleFilterChange("carimbo", v)}>
                    <SelectTrigger className="w-[170px]"><SelectValue placeholder="Carimbo..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Carimbos</SelectItem>
                      {processedData.filterOptions.carimbos.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* ── Filtros ativos ── */}
            {hasActiveFilters && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Filtros Ativos</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-2 flex-wrap">
                  {Object.entries(activeFilters).map(([key, value]) =>
                    value ? (
                      <Badge key={key} variant="secondary" className="text-sm gap-1">
                        <span className="capitalize">{key}:</span> {value}
                        <button onClick={() => handleFilterChange(key, "all")} className="rounded-full hover:bg-background/50 p-0.5">
                          <XIcon className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setActiveFilters({})}>Limpar filtros</Button>
                </CardContent>
              </Card>
            )}

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-foreground">
                <CardHeader>
                  <CardDescription>Valor Total</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(processedData.stats.total)}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{processedData.stats.count} solicitações</p></CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-600">
                <CardHeader>
                  <CardDescription>Aprovados</CardDescription>
                  <CardTitle className="text-2xl" style={{ color: COR_VERDE }}>{formatCurrency(processedData.stats.approved)}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{processedData.stats.approvedCount} solicitações</p></CardContent>
              </Card>
              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader>
                  <CardDescription>Pendentes</CardDescription>
                  <CardTitle className="text-2xl" style={{ color: COR_AMARELO }}>{formatCurrency(processedData.stats.pending)}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{processedData.stats.pendingCount} solicitações</p></CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                  <CardDescription>Rejeitados</CardDescription>
                  <CardTitle className="text-2xl text-red-600">{formatCurrency(processedData.stats.rejected)}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{processedData.stats.rejectedCount} solicitações</p></CardContent>
              </Card>
            </div>

            {/* ── Distribuição Mensal ── */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição Mensal</CardTitle>
                <CardDescription>Clique em um mês para filtrar</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[250px] w-full">
                  <ResponsiveContainer>
                    <AreaChart data={processedData.monthlyData} onClick={d => d?.activeLabel && handleFilterChange("month", d.activeLabel)}>
                      <defs>
                        <linearGradient id="gradVerde" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={COR_VERDE} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={COR_VERDE} stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                      <YAxis tickFormatter={v => `R$${Number(v)/1000}k`} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent formatter={v => formatCurrency(Number(v))} />} />
                      <Area dataKey="total" type="monotone" fill="url(#gradVerde)" stroke={COR_VERDE} strokeWidth={2} style={{ cursor: "pointer" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* ── Pizza + Natureza ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Por Tipo de Despesa</CardTitle>
                  <CardDescription>Clique para filtrar</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[340px] w-full">
                    <ResponsiveContainer>
                      <PieChart margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
                        <ChartTooltip content={<ChartTooltipContent hideLabel formatter={v => formatCurrency(Number(v))} />} />
                        <Pie
                          data={processedData.typeData} dataKey="value" nameKey="name"
                          innerRadius={70} outerRadius={110} paddingAngle={3}
                          onClick={d => handleFilterChange("type", d.name)} style={{ cursor: "pointer" }}
                          label={renderPieLabel} labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                        >
                          {processedData.typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Por Natureza da Despesa</CardTitle>
                  <CardDescription>Clique para filtrar</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[340px] w-full">
                    <ResponsiveContainer>
                      <BarChart data={processedData.natureData} layout="vertical" margin={{ right: 110 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={140} tick={{ fill: "#374151", fontSize: 12 }} />
                        <XAxis type="number" hide />
                        <ChartTooltip content={<ChartTooltipContent formatter={v => formatCurrency(Number(v))} />} />
                        <Bar dataKey="total" fill={COR_AMARELO} radius={4} minPointSize={4} style={{ cursor: "pointer" }} onClick={d => handleFilterChange("nature", d.name)}>
                          <LabelList dataKey="total" content={renderBarLabel} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* ── Por Plano ── */}
            <Card>
              <CardHeader>
                <CardTitle>Por Plano de Investimento</CardTitle>
                <CardDescription>Clique para filtrar</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[350px] w-full">
                  <ResponsiveContainer>
                    <BarChart data={processedData.planData} layout="vertical" margin={{ right: 110 }}>
                      <CartesianGrid horizontal={false} />
                      <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={220} tick={{ fill: "#374151", fontSize: 12 }} />
                      <XAxis type="number" hide />
                      <ChartTooltip content={<ChartTooltipContent formatter={v => formatCurrency(Number(v))} />} />
                      <Bar dataKey="total" fill={COR_VERDE} radius={4} minPointSize={4} style={{ cursor: "pointer" }} onClick={d => handleFilterChange("plan", d.name)}>
                        <LabelList dataKey="total" content={renderBarLabel} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* ══ GRÁFICO PONTE (WATERFALL) — Por Carimbo ══════════════════════ */}
            {processedData.waterfallData.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Por Carimbo — Gráfico Ponte
                  </CardTitle>
                  <CardDescription>
                    Cada barra parte do acumulado anterior até o total — clique para filtrar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[400px] w-full">
                    <ResponsiveContainer>
                      <BarChart
                        data={processedData.waterfallData}
                        margin={{ top: 40, right: 30, bottom: 20, left: 20 }}
                        barCategoryGap="30%"
                      >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />

                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={{ stroke: "#e5e7eb" }}
                          tick={({ x, y, payload }: any) => (
                            <text
                              x={x} y={y + 14}
                              textAnchor="middle"
                              fontSize={12}
                              fontWeight={payload.value === "TOTAL" ? 700 : 500}
                              fill={payload.value === "TOTAL" ? COR_TOTAL : "#374151"}
                            >
                              {payload.value}
                            </text>
                          )}
                        />

                        <YAxis
                          tickFormatter={v => formatShort(Number(v))}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                        />

                        {/* Tooltip customizado mostra o valor real (sem a base) */}
                        <Tooltip content={<WaterfallTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />

                        {/* Barra invisível — empurra a barra visível para cima */}
                        <Bar dataKey="base" stackId="wf" fill="transparent" radius={0} legendType="none" />

                        {/* Barra visível — o segmento real */}
                        <Bar
                          dataKey="value"
                          stackId="wf"
                          radius={[6, 6, 0, 0]}
                          minPointSize={3}
                          style={{ cursor: "pointer" }}
                          onClick={(d: any) => {
                            if (!d.isTotal) handleFilterChange("carimbo", d.name)
                          }}
                        >
                          {/* Label acima de cada barra com o valor acumulado */}
                          <LabelList
                            dataKey="value"
                            position="top"
                            formatter={(v: number) => formatShort(v)}
                            style={{ fontSize: 11, fontWeight: 600, fill: "#374151" }}
                          />

                          {processedData.waterfallData.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.isTotal ? COR_TOTAL : COR_AZUL}
                            />
                          ))}
                        </Bar>

                        {/* Linhas de conexão entre as barras (desenhadas via SVG customizado) */}
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Legenda manual */}
                  <div className="flex items-center gap-6 mt-2 px-2">
                    <span className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="inline-block w-4 h-3 rounded-sm" style={{ backgroundColor: COR_AZUL }} />
                      Parcela por carimbo
                    </span>
                    <span className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="inline-block w-4 h-3 rounded-sm" style={{ backgroundColor: COR_TOTAL }} />
                      Total acumulado
                    </span>
                  </div>

                  {/* ── Tabela resumo ── */}
                  <div className="mt-5 border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="text-left px-4 py-2 font-semibold text-slate-700">Carimbo</th>
                          <th className="text-right px-4 py-2 font-semibold text-slate-700">Valor</th>
                          <th className="text-right px-4 py-2 font-semibold text-slate-700">% do Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedData.carimboRows.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => handleFilterChange("carimbo", row.name)}
                          >
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: COR_AZUL }}>
                                <Tag className="h-3 w-3" />
                                {row.name}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-medium">
                              {formatCurrency(row.total)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.min((row.total / processedData.grandTotal) * 100, 100).toFixed(0)}%`,
                                      backgroundColor: COR_AZUL,
                                    }}
                                  />
                                </div>
                                <span className="text-slate-600 w-12 text-right">
                                  {((row.total / processedData.grandTotal) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-bold">
                          <td className="px-4 py-2 text-slate-800">TOTAL</td>
                          <td className="px-4 py-2 text-right font-mono text-slate-800">{formatCurrency(processedData.grandTotal)}</td>
                          <td className="px-4 py-2 text-right text-slate-800">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Tabela principal ── */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes das Solicitações</CardTitle>
                <CardDescription>{processedData.filteredRequests.length} itens — refletindo filtros ativos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[110px]">Tipo</TableHead>
                        <TableHead className="w-[130px]">Natureza</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[140px]">
                          <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Carimbo</span>
                        </TableHead>
                        <TableHead className="text-right w-[130px]">Valor</TableHead>
                        <TableHead>Solicitante</TableHead>
                        <TableHead className="text-center w-[110px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData.filteredRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Nenhuma solicitação encontrada com os filtros aplicados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        processedData.filteredRequests.map(req => (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">{req.type}</TableCell>
                            <TableCell>{req.natureza}</TableCell>
                            <TableCell className="text-sm">{req.investmentPlan}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{req.desc_fisico}</TableCell>
                            <TableCell>
                              {req.carimbo ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: COR_AZUL }}>
                                  <Tag className="h-3 w-3" />{req.carimbo.nome}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">{formatCurrency(req.totalValue)}</TableCell>
                            <TableCell className="text-sm">{req.requestedBy}</TableCell>
                            <TableCell className="text-center">{getStatusBadge(req.status)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
