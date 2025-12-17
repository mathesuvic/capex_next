"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Search, CheckCircle, XCircle, Eye, Filter } from "lucide-react"
import Link from "next/link"

interface Physical {
  description: string
  justification: string
}

interface MonthlyValue {
  month: string
  value: number
}

interface Request {
  id: string
  investmentPlan: string
  value: number
  physicals: Physical[]
  seasonalization: MonthlyValue[]
  status: "pending" | "approved" | "rejected"
  createdAt: string
  requestedBy: string
}

type StatusFilter = "all" | Request["status"]

export default function ManageRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/solicitacao-recursos", {
          method: "GET",
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Falha ao carregar (${res.status})`)
        const json = await res.json()
        setRequests(Array.isArray(json?.data) ? json.data : [])
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e?.message || "Erro ao carregar dados")
      } finally {
        setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [])

  // Chama API PATCH e sincroniza estado local
  const patchStatus = async (id: string, action: "approve" | "reject") => {
    try {
      setSavingId(id)
      const res = await fetch("/api/solicitacao-recursos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Falha ao atualizar status")
      }
      const newLocalStatus: Request["status"] = action === "approve" ? "approved" : "rejected"

      // Atualiza lista
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newLocalStatus } : r))
      )
      // Se o modal estiver aberto daquele item, atualiza também
      setSelectedRequest((prev) => (prev && prev.id === id ? { ...prev, status: newLocalStatus } : prev))
    } catch (e) {
      console.error(e)
      // Aqui pode disparar um toast se você tiver
      alert("Não foi possível atualizar o status. Tente novamente.")
    } finally {
      setSavingId(null)
    }
  }

  const handleApprove = (id: string) => {
    patchStatus(id, "approve")
  }

  const handleReject = (id: string) => {
    patchStatus(id, "reject")
  }

  const handleViewDetails = (request: Request) => {
    setSelectedRequest(request)
    setIsDialogOpen(true)
  }

  const filteredRequests = requests.filter((req) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      req.id.toLowerCase().includes(q) ||
      req.investmentPlan.toLowerCase().includes(q) ||
      req.requestedBy.toLowerCase().includes(q)
    const matchesStatus = statusFilter === "all" || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Pendente</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aprovado</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejeitado</Badge>
      default:
        return null
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-green-700 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Voltar ao Portal</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Solicitações</h1>
          </div>
          <p className="text-muted-foreground text-base ml-13">Visualize, aprove ou rejeite solicitações de recursos</p>
        </div>

        {/* Loading/Erro */}
        {loading && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Carregando solicitações...</p>
            </CardContent>
          </Card>
        )}
        {error && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-red-600">Erro: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        {!loading && !error && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ID, plano ou solicitante..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {requests.filter((r) => r.status === "pending").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Aprovados</p>
                    <p className="text-2xl font-bold text-green-600">
                      {requests.filter((r) => r.status === "approved").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rejeitados</p>
                    <p className="text-2xl font-bold text-red-600">
                      {requests.filter((r) => r.status === "rejected").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Requests Table */}
        {!loading && !error && (
          <Card>
            <CardHeader>
              <CardTitle>Solicitações ({filteredRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div key={request.id} className="border border-border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-sm font-semibold text-primary">{request.id}</span>
                            {getStatusBadge(request.status)}
                          </div>
                          <h3 className="font-semibold text-foreground mb-1">{request.investmentPlan}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>Valor: <strong className="text-primary">R$ {request.value.toLocaleString("pt-BR")}</strong></span>
                            <span>Solicitante: {request.requestedBy}</span>
                            <span>Data: {new Date(request.createdAt).toLocaleDateString("pt-BR")}</span>
                            <span>Físicos: {request.physicals.length}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(request)} className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Detalhes
                          </Button>
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(request.id)}
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                disabled={savingId === request.id}
                              >
                                <CheckCircle className="w-4 h-4" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(request.id)}
                                className="flex items-center gap-2"
                                disabled={savingId === request.id}
                              >
                                <XCircle className="w-4 h-4" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span>{selectedRequest?.id}</span>
                {selectedRequest && getStatusBadge(selectedRequest.status)}
              </DialogTitle>
              <DialogDescription>{selectedRequest?.investmentPlan}</DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-xl font-bold text-primary">R$ {selectedRequest.value.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Solicitante</p>
                    <p className="text-xl font-bold">{selectedRequest.requestedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data da Solicitação</p>
                    <p className="text-xl font-bold">{new Date(selectedRequest.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">Físicos ({selectedRequest.physicals.length})</h4>
                  <div className="space-y-3">
                    {selectedRequest.physicals.map((physical, index) => (
                      <div key={index} className="border border-border rounded-lg p-4 bg-white">
                        <p className="font-medium text-foreground mb-2">{physical.description}</p>
                        <p className="text-sm text-muted-foreground"><strong>Justificativa:</strong> {physical.justification}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">Sazonalização ({selectedRequest.seasonalization.length} meses)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedRequest.seasonalization.map((item, index) => (
                      <div key={index} className="border border-border rounded-lg p-3 bg-white">
                        <p className="text-sm text-muted-foreground mb-1">{item.month}</p>
                        <p className="text-lg font-bold text-primary">R$ {item.value.toLocaleString("pt-BR")}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedRequest.status === "pending" && (
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button
                      onClick={() => { handleApprove(selectedRequest.id); setIsDialogOpen(false) }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={savingId === selectedRequest.id}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aprovar Solicitação
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => { handleReject(selectedRequest.id); setIsDialogOpen(false) }}
                      className="flex-1"
                      disabled={savingId === selectedRequest.id}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeitar Solicitação
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
