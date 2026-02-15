"use client"

import { useMemo, useEffect, useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { XIcon } from "lucide-react"

// --- Types ---
type RequestItem = {
  id: string
  type: string
  natureza: string
  desc_fisico: string
  investmentPlan: string
  totalValue: number
  status: StatusFront
  requestDate: string
  requestedBy: string
  monthlyDistribution: Record<"jan" | "fev" | "mar" | "abr" | "mai" | "jun" | "jul" | "ago" | "set" | "out" | "nov" | "dez", number>
}
type StatusFront = "approved" | "pending" | "rejected"
type SummaryResponse = { ok: boolean; error?: string; updatedAt: string; requests: RequestItem[] }
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"] as const
const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#3b82f6"]

export default function DashboardResumoSolicitacoesPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | StatusFront>("all")
  const [data, setData] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        setActiveFilters({})
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

  const handleFilterChange = (key: string, value: any) => {
    const new_value = value === 'all' ? null : value
    setActiveFilters((prev) => ({
      ...Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key && k !== "month")),
      [key]: prev[key] === new_value ? null : new_value,
    }))
  }

  const processedData = useMemo(() => {
    if (!data) return null

    const filterOptions = {
        types: [...new Set(data.requests.map(r => r.type).filter(Boolean))].sort(),
        natures: [...new Set(data.requests.map(r => r.natureza).filter(Boolean))].sort(),
        plans: [...new Set(data.requests.map(r => r.investmentPlan).filter(Boolean))].sort(),
    }

    let filteredRequests = data.requests.filter((req) => {
      return Object.entries(activeFilters).every(([key, value]) => {
        if (value === null || value === undefined) return true
        if (key === 'month') {
          const monthKey = value.toLowerCase() as keyof RequestItem['monthlyDistribution']
          return req.monthlyDistribution[monthKey] > 0
        }
        const keyMap: Record<string, keyof RequestItem> = { type: "type", nature: "natureza", plan: "investmentPlan" }
        return req[keyMap[key]] === value
      })
    })

    const stats = filteredRequests.reduce((acc, r) => {
      acc.total += r.totalValue
      acc.count += 1
      if (r.status === "approved") { acc.approved += r.totalValue; acc.approvedCount += 1 } 
      else if (r.status === "pending") { acc.pending += r.totalValue; acc.pendingCount += 1 } 
      else { acc.rejected += r.totalValue; acc.rejectedCount += 1 }
      return acc
    }, { total: 0, approved: 0, pending: 0, rejected: 0, count: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 })

    const monthlyData = monthNames.map(name => {
      const total = filteredRequests.reduce((sum, req) => sum + (req.monthlyDistribution[name.slice(0, 3).toLowerCase() as keyof RequestItem['monthlyDistribution']] || 0), 0)
      return { name: name.slice(0, 3), total }
    })
    
    const reduceToMap = (key: keyof RequestItem) => filteredRequests.reduce((map, req) => {
      const itemKey = req[key] as string || "N/A"
      map.set(itemKey, (map.get(itemKey) || 0) + req.totalValue)
      return map
    }, new Map<string, number>())

    const planData = Array.from(reduceToMap("investmentPlan")).map(([name, total]) => ({ name, total }))
    const typeData = Array.from(reduceToMap("type")).map(([name, value]) => ({ name, value }))
    const natureData = Array.from(reduceToMap("natureza")).map(([name, total]) => ({ name, total }))
    
    return { stats, monthlyData, planData, typeData, natureData, filteredRequests, filterOptions }
  }, [data, activeFilters])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de Recursos</h1>
            <p className="text-muted-foreground">Visualize e analise as solicitações de recursos</p>
            {data?.updatedAt && <p className="text-xs text-muted-foreground mt-1">Atualizado em: {new Date(data.updatedAt).toLocaleString("pt-BR")}</p>}
          </div>
          <Button asChild variant="outline"><a href="/gerenciar-solicitacao">Voltar ao Gerenciamento</a></Button>
        </div>
        {loading && <Card><CardContent className="pt-6"><p className="text-muted-foreground">Carregando...</p></CardContent></Card>}
        {error && <Card><CardContent className="pt-6"><p className="text-red-600">Erro: {error}</p></CardContent></Card>}

        {!loading && !error && data && processedData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Filtros Gerais</CardTitle></CardHeader>
                <CardContent className="flex gap-3 flex-wrap"><Button variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")}>Todos Status</Button><Button variant={statusFilter === "approved" ? "default" : "outline"} onClick={() => setStatusFilter("approved")}>Aprovados</Button><Button variant={statusFilter === "pending" ? "default" : "outline"} onClick={() => setStatusFilter("pending")}>Pendentes</Button><Button variant={statusFilter === "rejected" ? "default" : "outline"} onClick={() => setStatusFilter("rejected")}>Rejeitados</Button></CardContent>
              </Card>
              
              <Card>
                  <CardHeader><CardTitle>Filtros Adicionais</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Select value={activeFilters.type || 'all'} onValueChange={(v) => handleFilterChange('type', v)}><SelectTrigger><SelectValue placeholder="Filtrar por tipo..." /></SelectTrigger><SelectContent><SelectItem value="all">Todos os Tipos</SelectItem>{processedData.filterOptions.types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                      <Select value={activeFilters.nature || 'all'} onValueChange={(v) => handleFilterChange('nature', v)}><SelectTrigger><SelectValue placeholder="Filtrar por natureza..." /></SelectTrigger><SelectContent><SelectItem value="all">Todas as Naturezas</SelectItem>{processedData.filterOptions.natures.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select>
                      <Select value={activeFilters.plan || 'all'} onValueChange={(v) => handleFilterChange('plan', v)}><SelectTrigger><SelectValue placeholder="Filtrar por plano..." /></SelectTrigger><SelectContent><SelectItem value="all">Todos os Planos</SelectItem>{processedData.filterOptions.plans.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                  </CardContent>
              </Card>
            </div>

            {Object.values(activeFilters).some(v => v !== null) && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Filtros Ativos</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-2 flex-wrap">
                  {Object.entries(activeFilters).map(([key, value]) => value && (
                      <Badge key={key} variant="secondary" className="text-sm gap-1">
                        <span className="capitalize">{key}:</span> {value}
                        <button onClick={() => handleFilterChange(key, value)} className="rounded-full hover:bg-background/50 p-0.5"><XIcon className="h-3 w-3" /></button>
                      </Badge>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => setActiveFilters({})}>Limpar filtros</Button>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-foreground"><CardHeader><CardDescription>Valor Total</CardDescription><CardTitle className="text-2xl">{formatCurrency(processedData.stats.total)}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{processedData.stats.count} solicitações</p></CardContent></Card>
                <Card className="border-l-4 border-l-primary"><CardHeader><CardDescription>Aprovados</CardDescription><CardTitle className="text-2xl text-primary">{formatCurrency(processedData.stats.approved)}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{processedData.stats.approvedCount} solicitações</p></CardContent></Card>
                <Card className="border-l-4 border-l-secondary"><CardHeader><CardDescription>Pendentes</CardDescription><CardTitle className="text-2xl text-secondary">{formatCurrency(processedData.stats.pending)}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{processedData.stats.pendingCount} solicitações</p></CardContent></Card>
                <Card className="border-l-4 border-l-accent"><CardHeader><CardDescription>Rejeitados</CardDescription><CardTitle className="text-2xl text-accent">{formatCurrency(processedData.stats.rejected)}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{processedData.stats.rejectedCount} solicitações</p></CardContent></Card>
            </div>
            
            <Card><CardHeader><CardTitle>Distribuição Mensal</CardTitle><CardDescription>Clique para filtrar por mês</CardDescription></CardHeader><CardContent><ChartContainer config={{}} className="h-[250px] w-full"><ResponsiveContainer><AreaChart data={processedData.monthlyData} onClick={(d) => d && handleFilterChange("month", d.activeLabel)}><defs><linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1} /></linearGradient></defs><CartesianGrid vertical={false} /><XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} /><YAxis tickFormatter={(value) => `R$${Number(value) / 1000}k`} tickLine={false} axisLine={false} /><ChartTooltip cursor={true} content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} /><Area dataKey="total" type="monotone" fill="url(#colorTotal)" stroke="var(--color-primary)" strokeWidth={2} style={{cursor: "pointer"}}/></AreaChart></ResponsiveContainer></ChartContainer></CardContent></Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Por Tipo de Despesa</CardTitle><CardDescription>Clique para filtrar</CardDescription></CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ChartContainer config={{}} className="h-[250px] w-full max-w-[250px]"><ResponsiveContainer>
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie data={processedData.typeData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} onClick={(d) => handleFilterChange("type", d.name)} style={{cursor: "pointer"}}>
                        {processedData.typeData.map((_, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                  </ResponsiveContainer></ChartContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Por Natureza da Despesa</CardTitle><CardDescription>Clique para filtrar</CardDescription></CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[250px] w-full"><ResponsiveContainer>
                    <BarChart data={processedData.natureData} layout="vertical">
                      <CartesianGrid horizontal={false} /><YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={120} /><XAxis type="number" hide /><ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                      <Bar dataKey="total" fill="var(--color-secondary)" radius={4} style={{cursor: "pointer"}} onClick={(d) => handleFilterChange("nature", d.name)} />
                    </BarChart>
                  </ResponsiveContainer></ChartContainer>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Por Plano de Investimento</CardTitle><CardDescription>Clique para filtrar</CardDescription></CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[350px] w-full"><ResponsiveContainer>
                  <BarChart data={processedData.planData} layout="vertical">
                    <CartesianGrid horizontal={false} /><YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={200} className="text-xs" /><XAxis type="number" hide /><ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                    <Bar dataKey="total" fill="var(--color-primary)" radius={4} style={{cursor: "pointer"}} onClick={(d) => handleFilterChange("plan", d.name)}/>
                  </BarChart>
                </ResponsiveContainer></ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Detalhes das Solicitações</CardTitle>
                <CardDescription>Lista de solicitações ({processedData.filteredRequests.length} itens, refletindo filtros ativos).</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Tipo</TableHead>
                      <TableHead className="w-[150px]">Natureza</TableHead>
                      <TableHead>Plano de Investimento</TableHead>
                      <TableHead>Descrição Física</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedData.filteredRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.type}</TableCell>
                        <TableCell>{req.natureza}</TableCell>
                        <TableCell>{req.investmentPlan}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{req.desc_fisico}</TableCell>
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
