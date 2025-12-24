// app/gerenciar-solicitacao/resumo/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type StatusFront = "approved" | "pending" | "rejected"

type RequestItem = {
  id: string
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
  statistics: {
    total: number
    approved: number
    pending: number
    rejected: number
    count: number
    approvedCount: number
    pendingCount: number
    rejectedCount: number
  }
  monthlyData: { month: string; value: number }[]
  planData: { plan: string; value: number }[]
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-primary text-white">Aprovado</Badge>
      case "pending":
        return <Badge className="bg-secondary text-white">Pendente</Badge>
      case "rejected":
        return <Badge className="bg-accent text-white">Rejeitado</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const monthlyData = data?.monthlyData ?? []
  const planData = data?.planData ?? []

  const maxMonthlyValue = useMemo(() => Math.max(1, ...monthlyData.map((d) => d.value)), [monthlyData])
  const maxPlanValue = useMemo(() => Math.max(1, ...planData.map((d) => d.value)), [planData])

  const filteredRequests = data?.requests ?? []

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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

        {/* Loading / Error */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Carregando...</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-600">Erro: {error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && data && (
          <>
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>Filtre os dados por status de aprovação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    onClick={() => setStatusFilter("all")}
                    className={statusFilter === "all" ? "bg-foreground text-background" : ""}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={statusFilter === "approved" ? "default" : "outline"}
                    onClick={() => setStatusFilter("approved")}
                    className={statusFilter === "approved" ? "bg-primary text-white" : ""}
                  >
                    Aprovados
                  </Button>
                  <Button
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    onClick={() => setStatusFilter("pending")}
                    className={statusFilter === "pending" ? "bg-secondary text-white" : ""}
                  >
                    Pendentes
                  </Button>
                  <Button
                    variant={statusFilter === "rejected" ? "default" : "outline"}
                    onClick={() => setStatusFilter("rejected")}
                    className={statusFilter === "rejected" ? "bg-accent text-white" : ""}
                  >
                    Rejeitados
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-foreground">
                <CardHeader>
                  <CardDescription>Valor Total</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(data.statistics.total)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{data.statistics.count} solicitações</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardDescription>Aprovados</CardDescription>
                  <CardTitle className="text-2xl text-primary">{formatCurrency(data.statistics.approved)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{data.statistics.approvedCount} solicitações</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-secondary">
                <CardHeader>
                  <CardDescription>Pendentes</CardDescription>
                  <CardTitle className="text-2xl text-secondary">{formatCurrency(data.statistics.pending)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{data.statistics.pendingCount} solicitações</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-accent">
                <CardHeader>
                  <CardDescription>Rejeitados</CardDescription>
                  <CardTitle className="text-2xl text-accent">{formatCurrency(data.statistics.rejected)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{data.statistics.rejectedCount} solicitações</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição Mensal</CardTitle>
                  <CardDescription>Valores previstos por mês (soma da sazonalização)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyData.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.month}</span>
                          <span className="text-muted-foreground">{formatCurrency(item.value)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary via-secondary to-accent h-full rounded-full transition-all"
                            style={{ width: `${(item.value / maxMonthlyValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* By Investment Plan Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Por Plano de Investimento</CardTitle>
                  <CardDescription>Valores totais por plano (valor_aporte)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {planData.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-balance line-clamp-2">{item.plan}</span>
                          <span className="text-muted-foreground whitespace-nowrap ml-2">{formatCurrency(item.value)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${(item.value / maxPlanValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle>Solicitações Detalhadas</CardTitle>
                <CardDescription>Lista completa de todas as solicitações filtradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Plano de Investimento</th>
                        <th className="text-left p-3 font-semibold">Valor Total</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                        <th className="text-left p-3 font-semibold">Data</th>
                        <th className="text-left p-3 font-semibold">Físicos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr key={request.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3 font-medium">{request.investmentPlan}</td>
                          <td className="p-3">{formatCurrency(request.totalValue)}</td>
                          <td className="p-3">{getStatusBadge(request.status)}</td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(request.requestDate).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">{request.physicals.length} itens</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
