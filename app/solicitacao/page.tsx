"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, X, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Physical {
  id: string
  plan: string
  description: string
  justification: string
  amount: number
  seasonalization: { month: string; value: number }[]
}

const months = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
]

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })

export default function ApprovalsPage() {
  const [email, setEmail] = useState("") // novo
  const [isSubmitting, setIsSubmitting] = useState(false) // novo
  const [physicals, setPhysicals] = useState<Physical[]>([])

  // Físico em edição (novo)
  const [newPhysical, setNewPhysical] = useState({
    plan: "",
    description: "",
    justification: "",
    amount: "" as string,
  })
  const [newMonthlyValues, setNewMonthlyValues] = useState<Record<string, string>>({})

  const parseNumber = (val: string) => Number.parseFloat((val || "").toString().replace(",", ".")) || 0

  // Totais do Físico em edição
  const amountNumber = parseNumber(newPhysical.amount)
  const distributedNew = Object.values(newMonthlyValues).reduce((s, v) => s + parseNumber(v), 0)
  const remainingNew = amountNumber - distributedNew
  const isBalancedNew = amountNumber > 0 && Math.abs(remainingNew) < 0.01

  const handleMonthlyValueChangeNew = (month: string, monthValue: string) => {
    setNewMonthlyValues((prev) => ({ ...prev, [month]: monthValue }))
  }

  const resetNewPhysical = () => {
    setNewPhysical({ plan: "", description: "", justification: "", amount: "" })
    setNewMonthlyValues({})
  }

  const handleAddPhysical = () => {
    const description = newPhysical.description.trim()
    const justification = newPhysical.justification.trim()
    const plan = newPhysical.plan

    if (!plan) return alert("Selecione um plano de investimento para o físico.")
    if (!description || !justification) return alert("Preencha descrição e justificativa do físico.")
    if (!amountNumber || amountNumber <= 0) return alert("Informe um valor de aporte válido para o físico.")
    if (!isBalancedNew) return alert("A sazonalização do físico precisa somar exatamente o valor do aporte.")

    const seasonalization = months
      .filter((m) => parseNumber(newMonthlyValues[m]) > 0)
      .map((m) => ({ month: m, value: parseNumber(newMonthlyValues[m]) }))

    setPhysicals((prev) => [
      ...prev,
      {
        id: crypto?.randomUUID?.() ?? Date.now().toString(),
        plan,
        description,
        justification,
        amount: amountNumber,
        seasonalization,
      },
    ])

    resetNewPhysical()
  }

  const handleRemovePhysical = (id: string) => {
    setPhysicals((prev) => prev.filter((p) => p.id !== id))
  }

  const resetAll = () => {
    setPhysicals([])
    resetNewPhysical()
    setEmail("")
  }

  const handleSubmit = async () => {
    if (!email) {
      alert("Informe o e-mail do solicitante.")
      return
    }
    if (physicals.length === 0) {
      alert("Adicione pelo menos um físico (com sazonalização) antes de enviar.")
      return
    }

    setIsSubmitting(true)
    try {
      const resp = await fetch("/api/solicitacao-recursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, physicals }),
      })

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        throw new Error(data?.error || `Falha ao salvar (${resp.status})`)
      }

      alert("Solicitação enviada e salva no MySQL!")
      resetAll()
    } catch (err: any) {
      console.error(err)
      alert(err?.message || "Erro ao salvar solicitação")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-primary hover:text-green-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Voltar ao Portal</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Aprovações de Recursos</h1>
          </div>
          <p className="text-muted-foreground text-base ml-12">
            Solicite aprovação de recursos para seus planos de investimento
          </p>
        </div>

        <div className="space-y-6">
          {/* Email do solicitante */}
          <Card>
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
              <CardDescription>E-mail do solicitante</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail do solicitante *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seuemail@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Adicionar Físico */}
          <Card>
            <CardHeader>
              <CardTitle>Novo Físico</CardTitle>
              <CardDescription>Informe os dados, o plano e a sazonalização do físico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="plan">Plano de Investimento *</Label>
                  <Select value={newPhysical.plan} onValueChange={(v) => setNewPhysical((p) => ({ ...p, plan: v }))}>
                    <SelectTrigger id="plan">
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="infraestrutura">Infraestrutura de Rede</SelectItem>
                      <SelectItem value="energia-renovavel">Energia Renovável</SelectItem>
                      <SelectItem value="eficiencia-energetica">Eficiência Energética</SelectItem>
                      <SelectItem value="transformadores">Transformadores e Equipamentos</SelectItem>
                      <SelectItem value="tecnologia">Tecnologia e Automação</SelectItem>
                      <SelectItem value="sustentabilidade">Sustentabilidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor do Aporte (R$) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={newPhysical.amount}
                    onChange={(e) => setNewPhysical((p) => ({ ...p, amount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição do Físico *</Label>
                <Textarea
                  id="description"
                  placeholder="Ex: Instalação de painéis solares na subestação X"
                  value={newPhysical.description}
                  onChange={(e) => setNewPhysical((p) => ({ ...p, description: e.target.value }))}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Justificativa *</Label>
                <Textarea
                  id="justification"
                  placeholder="Ex: Aumentar capacidade de geração, reduzir custos operacionais"
                  value={newPhysical.justification}
                  onChange={(e) => setNewPhysical((p) => ({ ...p, justification: e.target.value }))}
                  className="min-h-[80px]"
                />
              </div>

              {/* Sazonalização do Físico em edição */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-100 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Valor do Físico</p>
                    <p className="text-xl font-bold text-primary">{formatBRL(amountNumber)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Distribuído</p>
                    <p className="text-xl font-bold text-blue-600">{formatBRL(distributedNew)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Restante</p>
                    <p className={`text-xl font-bold ${remainingNew >= 0 ? "text-orange-600" : "text-red-600"}`}>
                      {formatBRL(remainingNew)}
                    </p>
                  </div>
                </div>

                {!isBalancedNew && amountNumber > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900">
                        Atenção: a soma dos valores mensais deve ser igual ao valor do físico.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {months.map((month) => (
                    <div key={month} className="space-y-2">
                      <Label htmlFor={`new-month-${month}`} className="text-sm font-medium">
                        {month}
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">R$</span>
                        <Input
                          id={`new-month-${month}`}
                          type="number"
                          placeholder="0,00"
                          value={newMonthlyValues[month] || ""}
                          onChange={(e) => handleMonthlyValueChangeNew(month, e.target.value)}
                          className="flex-1"
                          step="0.01"
                          min="0"
                          disabled={amountNumber === 0}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleAddPhysical}
                className="w-full bg-primary hover:bg-green-700 text-white flex items-center justify-center gap-2"
                disabled={
                  !newPhysical.plan ||
                  !newPhysical.description.trim() ||
                  !newPhysical.justification.trim() ||
                  amountNumber <= 0 ||
                  !isBalancedNew ||
                  distributedNew <= 0
                }
              >
                <Plus className="w-4 h-4" />
                Adicionar Físico
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Físicos adicionados */}
          <Card>
            <CardHeader>
              <CardTitle>Físicos Adicionados</CardTitle>
              <CardDescription>Revise os físicos adicionados e suas sazonalizações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {physicals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum físico adicionado ainda.</p>
              ) : (
                physicals.map((physical) => (
                  <div key={physical.id} className="border border-border rounded-lg p-4 bg-slate-50">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="text-xs text-muted-foreground">Plano: {physical.plan}</div>
                        <p className="font-medium text-foreground">{physical.description}</p>
                        <p className="text-sm text-muted-foreground">{physical.justification}</p>

                        <div className="mt-3">
                          <div className="text-sm font-semibold text-primary">
                            Valor do Físico: {formatBRL(physical.amount)}
                          </div>
                          {physical.seasonalization.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {physical.seasonalization.map((s) => (
                                <span
                                  key={`${physical.id}-${s.month}`}
                                  className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                                >
                                  {s.month}: {formatBRL(s.value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleRemovePhysical(physical.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-primary hover:bg-green-700 text-white text-lg py-6 disabled:opacity-60"
              disabled={physicals.length === 0 || isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
            <Link href="/home" className="flex-1">
              <Button variant="outline" className="w-full text-lg py-6 bg-transparent">
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
