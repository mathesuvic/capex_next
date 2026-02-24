"use client"

import { useMemo, useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Wallet,
  Target,
  HardHat,
  LandPlot,
  BarChart3,
  ArrowLeft,
  RefreshCw,
  XCircle,
  ClipboardCheck,
} from "lucide-react"

// --- Types ---
type StatusCapex = "PENDENTE" | "FINALIZADO" | "PARCIAL"
type StatusFisico = "SIM" | "NAO" | "PENDENTE"

interface SummaryData {
  totalSubplans: number
  totalMeta: number
  capexFinalizadoCount: number
  capexFinalizadoMeta: number
  capexParcialCount: number
  capexParcialMeta: number
  capexPendenteCount: number
  capexPendenteMeta: number
  totalFinalizadosParaFisico: number
  totalMetaFinalizadosParaFisico: number
  fisicoSimCount: number
  fisicoSimMeta: number
  fisicoNaoCount: number
  fisicoNaoMeta: number
  fisicoPendenteCount: number
  fisicoPendenteMeta: number
}

interface PlanData {
  name: string
  totalMeta: number
  finalizadoMeta: number
  totalCount: number
  finalizadoCount: number
  pendenteMeta: number
}

interface SubplanDetail {
  label: string
  plano: string
  meta: number
  status_capex: StatusCapex
  status_fisico: StatusFisico
}

interface ApiResponse {
  ok: boolean
  error?: string
  updatedAt: string
  summary: SummaryData
  byPlan: PlanData[]
  subplanDetails: SubplanDetail[]
}

// --- Constants ---
const TEAL = "hsl(168 64% 42%)"
const AMBER = "hsl(38 92% 50%)"
const SLATE = "hsl(220 10% 46%)"
const RED = "hsl(0 72% 56%)"
const BLUE = "hsl(200 70% 50%)"

const PIE_COLORS_CAPEX: Record<string, string> = {
  Finalizado: TEAL,
  Parcial: AMBER,
  Pendente: SLATE,
}

const PIE_COLORS_FISICO: Record<string, string> = {
  SIM: TEAL,
  "NAO": RED,
  "Pendente Fisico": SLATE,
}

const BAR_COLORS = [TEAL, AMBER, "hsl(220 30% 20%)", BLUE, RED, "hsl(168 64% 60%)", "hsl(38 70% 65%)", "hsl(220 40% 45%)"]

// --- Helpers ---
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

const formatCompact = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)

const formatPercent = (value: number, total: number) =>
  total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0%"

// --- Sub-components ---
function StatusBadge({ status }: { status: StatusCapex | StatusFisico }) {
  switch (status) {
    case "FINALIZADO":
      return (
        <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/20 font-medium">
          Finalizado
        </Badge>
      )
    case "PARCIAL":
      return (
        <Badge className="bg-secondary/15 text-secondary border-secondary/20 hover:bg-secondary/20 font-medium">
          Parcial
        </Badge>
      )
    case "PENDENTE":
      return (
        <Badge className="bg-muted text-muted-foreground border-border hover:bg-muted font-medium">
          Pendente
        </Badge>
      )
    case "SIM":
      return (
        <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/20 font-medium">
          Sim
        </Badge>
      )
    case "NAO":
      return (
        <Badge className="bg-accent/15 text-accent border-accent/20 hover:bg-accent/20 font-medium">
          Nao
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <Skeleton className="h-[360px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCardsCapex({ summary }: { summary: SummaryData }) {
  const cards = [
    {
      label: "Conclusao Financeira (Qtd)",
      value: `${summary.capexFinalizadoCount}`,
      sub: `de ${summary.totalSubplans} subplanos`,
      badge: formatPercent(summary.capexFinalizadoCount, summary.totalSubplans),
      icon: Wallet,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      badgeClass: "bg-primary/15 text-primary border-primary/20",
    },
    {
      label: "Conclusao Financeira (Meta)",
      value: formatCurrency(summary.capexFinalizadoMeta),
      sub: `de ${formatCurrency(summary.totalMeta)}`,
      badge: formatPercent(summary.capexFinalizadoMeta, summary.totalMeta),
      icon: Target,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
      badgeClass: "bg-secondary/15 text-secondary border-secondary/20",
    },
    {
      label: "Conclusao Fisica (Qtd)",
      value: `${summary.fisicoSimCount}`,
      sub: `de ${summary.totalFinalizadosParaFisico} finalizados`,
      badge: formatPercent(summary.fisicoSimCount, summary.totalFinalizadosParaFisico),
      icon: HardHat,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      badgeClass: "bg-accent/15 text-accent border-accent/20",
    },
    {
      label: "Conclusao Fisica (Meta)",
      value: formatCurrency(summary.fisicoSimMeta),
      sub: `de ${formatCurrency(summary.totalMetaFinalizadosParaFisico)}`,
      badge: formatPercent(summary.fisicoSimMeta, summary.totalMetaFinalizadosParaFisico),
      icon: LandPlot,
      iconBg: "bg-foreground/10",
      iconColor: "text-foreground",
      badgeClass: "bg-muted text-muted-foreground border-border",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <p className="text-2xl font-bold tracking-tight text-card-foreground">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </div>
              <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
            <Badge variant="outline" className={`mt-3 ${card.badgeClass} text-xs`}>
              {card.badge} do total
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CapexStatusDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-card-foreground">
          Status Financeiro (CAPEX)
        </CardTitle>
        <CardDescription>Distribuicao por status de conclusao</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={{}} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={PIE_COLORS_CAPEX[entry.name] || SLATE}
                  />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const item = payload[0]
                  const pct = total > 0 ? Math.round(((item.value as number) / total) * 100) : 0
                  return (
                    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-muted-foreground">
                        {item.value} subplanos ({pct}%)
                      </p>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex items-center justify-center gap-6 -mt-2">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PIE_COLORS_CAPEX[entry.name] || SLATE }}
              />
              <span className="text-xs text-muted-foreground">
                {entry.name} ({entry.value})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function FisicoStatusDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-card-foreground">
          Status Fisico
        </CardTitle>
        <CardDescription>Base: subplanos com CAPEX finalizado</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={{}} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={PIE_COLORS_FISICO[entry.name] || SLATE}
                  />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const item = payload[0]
                  const pct = total > 0 ? Math.round(((item.value as number) / total) * 100) : 0
                  return (
                    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-muted-foreground">
                        {item.value} subplanos ({pct}%)
                      </p>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex items-center justify-center gap-6 -mt-2">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PIE_COLORS_FISICO[entry.name] || SLATE }}
              />
              <span className="text-xs text-muted-foreground">
                {entry.name} ({entry.value})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PlanProgressChart({ data }: { data: PlanData[] }) {
  const truncatedData = data.map((item) => ({
    ...item,
    shortName: item.name.length > 25 ? `${item.name.substring(0, 25)}...` : item.name,
  }))

  const chartConfig = {
    finalizadoMeta: { label: "Meta Finalizada", color: TEAL },
    pendenteMeta: { label: "Meta Pendente", color: "hsl(220 14% 82%)" },
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-card-foreground">
          Progresso por Plano de Investimento
        </CardTitle>
        <CardDescription>Meta finalizada vs. pendente por plano</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={truncatedData}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="hsl(220 14% 89%)"
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => formatCompact(v)}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                width={160}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const label = name === "finalizadoMeta" ? "Finalizado" : "Pendente"
                      return `${label}: ${formatCurrency(value as number)}`
                    }}
                  />
                }
              />
              <Bar
                dataKey="finalizadoMeta"
                name="Meta Finalizada"
                fill={TEAL}
                radius={[0, 0, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="pendenteMeta"
                name="Meta Pendente"
                fill="hsl(220 14% 82%)"
                radius={[0, 4, 4, 0]}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TEAL }} />
            <span className="text-xs text-muted-foreground">Meta Finalizada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "hsl(220 14% 82%)" }} />
            <span className="text-xs text-muted-foreground">Meta Pendente</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TopPlansBars({ data }: { data: PlanData[] }) {
  const topPlans = data.slice(0, 8)

  const truncatedData = topPlans.map((item) => ({
    ...item,
    shortName: item.name.length > 20 ? `${item.name.substring(0, 20)}...` : item.name,
  }))

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-card-foreground">
          Meta Total por Plano
        </CardTitle>
        <CardDescription>Top planos por valor de meta</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={{}} className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={truncatedData}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="hsl(220 14% 89%)"
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => formatCompact(v)}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                width={140}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelKey="name"
                    formatter={(value) => formatCurrency(value as number)}
                  />
                }
              />
              <Bar dataKey="totalMeta" radius={[0, 6, 6, 0]} barSize={28}>
                {truncatedData.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function SubplanTable({ details }: { details: SubplanDetail[] }) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-card-foreground">
          Detalhes dos Subplanos
        </CardTitle>
        <CardDescription>
          {details.length} subplanos no total
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[480px] overflow-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/50">
                <TableHead className="font-semibold">Plano de Investimento</TableHead>
                <TableHead className="font-semibold">Subplano</TableHead>
                <TableHead className="font-semibold text-right">Meta</TableHead>
                <TableHead className="font-semibold text-center">Status Financeiro</TableHead>
                <TableHead className="font-semibold text-center">Status Fisico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Nenhum subplano encontrado
                  </TableCell>
                </TableRow>
              ) : (
                details.map((item, index) => (
                  <TableRow key={`${item.label}-${index}`} className="group">
                    <TableCell className="text-muted-foreground max-w-[240px] truncate">
                      {item.plano}
                    </TableCell>
                    <TableCell className="font-medium max-w-[280px] truncate">
                      {item.label}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(item.meta)}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={item.status_capex} />
                    </TableCell>
                    <TableCell className="text-center">
                      {item.status_capex === "FINALIZADO" ? (
                        <StatusBadge status={item.status_fisico} />
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Main Page ---
export default function DashboardResumoConclusaoPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const apiUrl = process.env.NEXT_PUBLIC_APP_URL || ""
        const res = await fetch(`${apiUrl}/api/capex/getsummary`, {
          signal: controller.signal,
          cache: "no-store",
        })

        const json = (await res.json().catch(() => ({}))) as ApiResponse
        if (!res.ok || !json?.ok)
          throw new Error(json?.error || `Falha ao carregar (${res.status})`)
        setData(json)
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string }
        if (err.name !== "AbortError")
          setError(err?.message || "Erro ao carregar resumo")
      } finally {
        setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [])

  const processedData = useMemo(() => {
    if (!data) return null

    const { summary, byPlan } = data
    const capexStatusData = [
      { name: "Finalizado", value: summary.capexFinalizadoCount },
      { name: "Parcial", value: summary.capexParcialCount },
      { name: "Pendente", value: summary.capexPendenteCount },
    ].filter((d) => d.value > 0)

    const fisicoStatusData = [
      { name: "SIM", value: summary.fisicoSimCount },
      { name: "NAO", value: summary.fisicoNaoCount },
      { name: "Pendente Fisico", value: summary.fisicoPendenteCount },
    ].filter((d) => d.value > 0)

    const byPlanStacked = byPlan
      .map((plan) => ({
        ...plan,
        pendenteMeta: plan.totalMeta - plan.finalizadoMeta,
      }))
      .sort((a, b) => b.totalMeta - a.totalMeta)

    return { capexStatusData, fisicoStatusData, byPlanStacked }
  }, [data])

  return (
    <div className="min-h-screen bg-background">
      {/* Header - matching main dashboard */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-primary-foreground">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-card-foreground leading-tight">
                  Resumo de Conclusao CAPEX
                </h1>
                <p className="text-xs text-muted-foreground">
                  {data?.updatedAt
                    ? `Atualizado em ${new Date(data.updatedAt).toLocaleString("pt-BR")}`
                    : "Progresso de finalizacao financeira e fisica"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {loading && (
                <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
              )}
              <Button variant="outline" size="sm" asChild className="gap-2 bg-transparent">
                <a href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Error State */}
        {error && (
          <Card className="border-accent/30 bg-accent/5 border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-accent flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-accent">
                    Erro ao carregar dados
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {error}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && !data && <LoadingSkeleton />}

        {/* Main Content */}
        {data && processedData && (
          <>
            {/* KPI Cards */}
            <KpiCardsCapex summary={data.summary} />

            {/* Donut Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CapexStatusDonut data={processedData.capexStatusData} />
              <FisicoStatusDonut data={processedData.fisicoStatusData} />
            </div>

            {/* Bar Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PlanProgressChart data={processedData.byPlanStacked} />
              <TopPlansBars data={processedData.byPlanStacked} />
            </div>

            {/* Detail Table */}
            <SubplanTable details={data.subplanDetails} />
          </>
        )}
      </main>
    </div>
  )
}
