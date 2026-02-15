"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// --- Types ATUALIZADOS ---
type StatusFront = "approved" | "pending" | "rejected"
type RequestItem = {
  id: string
  type: string // <-- NOVO CAMPO
  investmentPlan: string
  totalValue: number
  status: StatusFront
  requestDate: string
  requestedBy: string
  physicals: { description: string; justification: string }[]
  monthlyDistribution: Record<"jan" | "fev" | "mar" | "abr" | "mai" | "jun" | "jul" | "ago" | "set" | "out" | "nov" | "dez", number>
}
type SummaryResponse = {
  ok: boolean
  error?: string
  updatedAt: string
  filters: { status: "all" | StatusFront }
  requests: RequestItem[]
  statistics: { total: number; approved: number; pending: number; rejected: number; count: number; approvedCount: number; pendingCount: number; rejectedCount: number }
  monthlyData: { month: string; value: number }[]
  planData: { plan: string; value: number }[]
  typeData: { type: string; value: number }[]
  natureData: { nature: string; value: number }[]
}

export default function DashboardResumoSolicitacoesPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | StatusFront>("all")
  const [data, setData] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const qs = new URLSearchParams()
        qs.set("status", statusFilter)
        const res = await fetch(`/api/solicitacao-recursos/resumo?${qs.toString()}`, { signal: controller.signal })
        const json = (await res.json().catch(() => ({}))) as SummaryResponse
        if (!res.ok || !json?.ok) throw new Error(json?.error || `Falha ao carregar (${res.status})`)
        setData(json)
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e?.message || "Erro ao carregar resumo")
      } finally {
        setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [statusFilter])

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
  const getStatusBadge = (status: StatusFront) => {
    const statusMap: Record<StatusFront, { label: string; className: string }> = {
      approved: { label: "Aprovado", className: "bg-green-600 hover:bg-green-700" },
      pending: { label: "Pendente", className: "bg-yellow-500 hover:bg-yellow-600" },
      rejected: { label: "Rejeitado", className: "bg-red-600 hover:bg-red-700" },
    }
    const { label, className } = statusMap[status] || { label: "N/A", className: "bg-gray-500" }
    return <Badge className={`${className} text-white`}>{label}</Badge>
  }

  // --- Lógica dos dados dos gráficos (sem mudanças) ---
  const chartDataConfig = {
    monthly: data?.monthlyData.map((item) => ({ name: item.month.slice(0, 3), total: item.value })) ?? [],
    plan: data?.planData.map((item) => ({ name: item.plan, total: item.value })) ?? [],
    nature: data?.natureData.map((item) => ({ name: item.nature, total: item.value })) ?? [],
    type: data?.typeData.map((item) => ({ name: item.type, value: item.value, fill: `var(--color-${item.type})` })) ?? [],
  }
  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#3b82f6"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header e KPIs (sem mudanças) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de Recursos</h1>
            <p className="text-muted-foreground">Visualize e analise as solicitações de recursos</p>
            {data?.updatedAt && <p className="text-xs text-muted-foreground mt-1">Atualizado em: {new Date(data.updatedAt).toLocaleString("pt-BR")}</p>}
          </div>
          <Button asChild variant="outline"><a href="/gerenciar-solicitacao">Voltar ao Gerenciamento</a></Button>
        </div>
        {loading && <Card><CardContent className="pt-6"><p>Carregando...</p></CardContent></Card>}
        {error && <Card><CardContent className="pt-6"><p className="text-red-600">Erro: {error}</p></CardContent></Card>}

        {!loading && !error && data && (
          <>
            {/* Filtros e KPIs (sem mudanças) */}
            <Card><CardHeader><CardTitle>Filtros</CardTitle><CardDescription>Filtre os dados por status</CardDescription></CardHeader><CardContent><div className="flex gap-3 flex-wrap"><Button variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")}>Todos</Button><Button variant={statusFilter === "approved" ? "default" : "outline"} onClick={() => setStatusFilter("approved")}>Aprovados</Button><Button variant={statusFilter === "pending" ? "default" : "outline"} onClick={() => setStatusFilter("pending")}>Pendentes</Button><Button variant={statusFilter === "rejected" ? "default" : "outline"} onClick={() => setStatusFilter("rejected")}>Rejeitados</Button></div></CardContent></Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><Card className="border-l-4 border-l-foreground"><CardHeader><CardDescription>Valor Total</CardDescription><CardTitle className="text-2xl">{formatCurrency(data.statistics.total)}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{data.statistics.count} solicitações</p></CardContent></Card><Card className="border-l-4 border-l-primary"><CardHeader><CardDescription>Aprovados</CardDescription><CardTitle className="text-2xl text-primary">{formatCurrency(data.statistics.approved)}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{data.statistics.approvedCount} solicitações</p></CardContent></Card><Card className="border-l-4 border-l-secondary"><CardHeader><CardDescription>Pendentes</CardDescription><CardTitle className="text-2xl text-secondary">{formatCurrency(data.statistics.pending)}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{data.statistics.pendingCount} solicitações</p></CardContent></Card><Card className="border-l-4 border-l-accent"><CardHeader><CardDescription>Rejeitados</CardDescription><CardTitle className="text-2xl text-accent">{formatCurrency(data.statistics.rejected)}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{data.statistics.rejectedCount} solicitações</p></CardContent></Card></div>
            
            {/* Layout dos Gráficos (sem mudanças) */}
            <Card><CardHeader><CardTitle>Distribuição Mensal</CardTitle><CardDescription>Valores previstos por mês</CardDescription></CardHeader><CardContent><ChartContainer config={{}} className="h-[250px] w-full"><ResponsiveContainer><AreaChart data={chartDataConfig.monthly}><defs><linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1} /></linearGradient></defs><CartesianGrid vertical={false} /><XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} /><YAxis tickFormatter={(value) => `R$${Number(value) / 1000}k`} tickLine={false} axisLine={false} /><ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} /><Area dataKey="total" type="monotone" fill="url(#colorTotal)" stroke="var(--color-primary)" strokeWidth={2} /></AreaChart></ResponsiveContainer></ChartContainer></CardContent></Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card><CardHeader><CardTitle>Por Tipo de Despesa</CardTitle><CardDescription>Divisão CAPEX/OPEX</CardDescription></CardHeader><CardContent className="flex items-center justify-center"><ChartContainer config={{}} className="h-[250px] w-full max-w-[250px]"><ResponsiveContainer><PieChart><ChartTooltip content={<ChartTooltipContent hideLabel />} /><Pie data={chartDataConfig.type} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80}>{chartDataConfig.type.map((_, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}</Pie><ChartLegend content={<ChartLegendContent nameKey="name" />} /></PieChart></ResponsiveContainer></ChartContainer></CardContent></Card><Card><CardHeader><CardTitle>Por Natureza da Despesa</CardTitle><CardDescription>Valores pela natureza do gasto</CardDescription></CardHeader><CardContent><ChartContainer config={{}} className="h-[250px] w-full"><ResponsiveContainer><BarChart data={chartDataConfig.nature} layout="vertical"><CartesianGrid horizontal={false} /><YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={120} /><XAxis type="number" hide /><ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} /><Bar dataKey="total" fill="var(--color-secondary)" radius={4} /></BarChart></ResponsiveContainer></ChartContainer></CardContent></Card></div>
            <Card><CardHeader><CardTitle>Por Plano de Investimento</CardTitle><CardDescription>Valores por plano detalhado</CardDescription></CardHeader><CardContent><ChartContainer config={{}} className="h-[350px] w-full"><ResponsiveContainer><BarChart data={chartDataConfig.plan} layout="vertical"><CartesianGrid horizontal={false} /><YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={200} className="text-xs" /><XAxis type="number" hide /><ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} /><Bar dataKey="total" fill="var(--color-primary)" radius={4} /></BarChart></ResponsiveContainer></ChartContainer></CardContent></Card>
            
            {/* --- NOVA SEÇÃO: TABELA DE RESUMO --- */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes das Solicitações</CardTitle>
                <CardDescription>
                  Lista de todas as solicitações incluídas nos cálculos acima ({data.requests.length} itens).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Plano de Investimento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.requests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.type}</TableCell>
                        <TableCell>{req.investmentPlan}</TableCell>
                        <TableCell className="text-right">{formatCurrency(req.totalValue)}</TableCell>
                        <TableCell>{req.requestedBy}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(req.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
