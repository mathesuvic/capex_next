// app/solicitacao/SolicitacaoForm.tsx
"use client"

import { useState } from "react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Plus, X, AlertCircle, Tag, Loader2 } from "lucide-react"
import Link from "next/link"

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface CarimboOption {
  id  : number
  nome: string
}

interface Physical {
  id             : string
  plan           : string
  carimboId      : number | null
  carimboNome    : string
  description    : string
  justification  : string
  amount         : number
  seasonalization: { month: string; value: number }[]
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
]

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style             : "currency",
    currency          : "BRL",
    minimumFractionDigits: 2,
  })

// ─── Props ────────────────────────────────────────────────────────────────────
interface SolicitacaoFormProps {
  userEmail: string
  plans    : string[]
  carimbos : CarimboOption[]   // ✅ recebe do servidor (sem fetch no cliente)
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function SolicitacaoForm({ userEmail, plans, carimbos }: SolicitacaoFormProps) {

  // ── Estado: formulário do novo físico
  const [newPhysical, setNewPhysical] = useState({
    plan         : "",
    carimboId    : null as number | null,
    carimboNome  : "",
    description  : "",
    justification: "",
    amount       : "" as string,
  })
  const [newMonthlyValues, setNewMonthlyValues] = useState<Record<string, string>>({})

  // ── Estado: lista de físicos confirmados + envio
  const [physicals,    setPhysicals   ] = useState<Physical[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Cálculos financeiros
  const parseNumber = (val: string) =>
    Number.parseFloat((val || "").replace(",", ".")) || 0

  const amountNumber   = parseNumber(newPhysical.amount)
  const distributedNew = Object.values(newMonthlyValues).reduce(
    (sum, v) => sum + parseNumber(v), 0
  )
  const remainingNew  = amountNumber - distributedNew
  const isBalancedNew = amountNumber > 0 && Math.abs(remainingNew) < 0.01

  // ── Handlers
  const handleMonthChange = (month: string, val: string) =>
    setNewMonthlyValues(prev => ({ ...prev, [month]: val }))

  const resetNewPhysical = () => {
    setNewPhysical({
      plan:"", carimboId:null, carimboNome:"",
      description:"", justification:"", amount:"",
    })
    setNewMonthlyValues({})
  }

  const handleAddPhysical = () => {
    const description   = newPhysical.description.trim()
    const justification = newPhysical.justification.trim()

    if (!newPhysical.plan) return alert("Selecione um Plano de Investimento.")
    if (!description)      return alert("Informe a Descrição do Físico.")
    if (!justification)    return alert("Informe a Justificativa.")
    if (amountNumber <= 0) return alert("Informe um valor de aporte válido.")
    if (!isBalancedNew)    return alert("A sazonalização deve somar exatamente o valor do aporte.")

    const seasonalization = MONTHS
      .filter(m => parseNumber(newMonthlyValues[m]) > 0)
      .map(m => ({ month: m, value: parseNumber(newMonthlyValues[m]) }))

    setPhysicals(prev => [
      ...prev,
      {
        id: crypto?.randomUUID?.() ?? String(Date.now()),
        plan        : newPhysical.plan,
        carimboId   : newPhysical.carimboId,
        carimboNome : newPhysical.carimboNome,
        description,
        justification,
        amount      : amountNumber,
        seasonalization,
      },
    ])
    resetNewPhysical()
  }

  const handleRemovePhysical = (id: string) =>
    setPhysicals(prev => prev.filter(p => p.id !== id))

  const handleSubmit = async () => {
    if (physicals.length === 0) {
      alert("Adicione pelo menos um físico antes de enviar.")
      return
    }

    setIsSubmitting(true)
    try {
      const resp = await fetch("/api/solicitacao-recursos", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
          email    : userEmail,
          physicals: physicals.map(p => ({
            plan           : p.plan,
            carimboId      : p.carimboId,
            description    : p.description,
            justification  : p.justification,
            amount         : p.amount,
            seasonalization: p.seasonalization,
          })),
        }),
      })

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        throw new Error(data?.error || `Falha ao salvar (${resp.status})`)
      }

      alert("Solicitação enviada com sucesso!")
      setPhysicals([])
      resetNewPhysical()
    } catch (err: any) {
      console.error(err)
      alert(err?.message || "Erro ao salvar solicitação")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Valida se pode adicionar
  const canAdd =
    !!newPhysical.plan &&
    !!newPhysical.description.trim() &&
    !!newPhysical.justification.trim() &&
    amountNumber > 0 &&
    isBalancedNew &&
    distributedNew > 0

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Card: Novo Físico ── */}
      <Card>
        <CardHeader>
          <CardTitle>Novo Físico</CardTitle>
          <CardDescription>
            Informe os dados, o plano e a sazonalização do físico
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* ── Linha 1: Plano + Carimbo + Valor ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Plano de Investimento */}
            <div className="space-y-2">
              <Label htmlFor="plan">Plano de Investimento *</Label>
              <Select
                value={newPhysical.plan}
                onValueChange={v => setNewPhysical(p => ({ ...p, plan: v }))}
              >
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Carimbo */}
            <div className="space-y-2">
              <Label htmlFor="carimbo" className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Carimbo
              </Label>
              <Select
                value={newPhysical.carimboId !== null ? String(newPhysical.carimboId) : "__none__"}
                onValueChange={v => {
                  if (!v || v === "__none__") {
                    setNewPhysical(p => ({ ...p, carimboId: null, carimboNome: "" }))
                    return
                  }
                  const found = carimbos.find(c => c.id === Number(v))
                  setNewPhysical(p => ({
                    ...p,
                    carimboId  : found?.id   ?? null,
                    carimboNome: found?.nome ?? "",
                  }))
                }}
              >
                <SelectTrigger id="carimbo">
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sem carimbo —</SelectItem>
                  {carimbos.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor do Aporte */}
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
                onChange={e => setNewPhysical(p => ({ ...p, amount: e.target.value }))}
              />
            </div>
          </div>

          {/* ── Descrição ── */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição do Físico *</Label>
            <Textarea
              id="description"
              placeholder="Ex: Instalação de painéis solares na subestação X"
              value={newPhysical.description}
              onChange={e => setNewPhysical(p => ({ ...p, description: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>

          {/* ── Justificativa ── */}
          <div className="space-y-2">
            <Label htmlFor="justification">Justificativa *</Label>
            <Textarea
              id="justification"
              placeholder="Ex: Aumentar capacidade de geração, reduzir custos operacionais"
              value={newPhysical.justification}
              onChange={e => setNewPhysical(p => ({ ...p, justification: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>

          {/* ── Sazonalização ── */}
          <div className="space-y-4">

            {/* Resumo financeiro */}
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

            {/* Alerta de desbalanceamento */}
            {!isBalancedNew && amountNumber > 0 && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-orange-900">
                  Atenção: a soma dos valores mensais deve ser igual ao valor do físico.
                </p>
              </div>
            )}

            {/* Grid dos meses */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MONTHS.map(month => (
                <div key={month} className="space-y-2">
                  <Label htmlFor={`month-${month}`} className="text-sm font-medium">
                    {month}
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">R$</span>
                    <Input
                      id={`month-${month}`}
                      type="number"
                      placeholder="0,00"
                      value={newMonthlyValues[month] || ""}
                      onChange={e => handleMonthChange(month, e.target.value)}
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

          {/* ── Botão Adicionar ── */}
          <Button
            onClick={handleAddPhysical}
            className="w-full bg-primary hover:bg-green-700 text-white flex items-center justify-center gap-2"
            disabled={!canAdd}
          >
            <Plus className="w-4 h-4" />
            Adicionar Físico
          </Button>

        </CardContent>
      </Card>

      {/* ── Card: Físicos Adicionados ── */}
      <Card>
        <CardHeader>
          <CardTitle>Físicos Adicionados</CardTitle>
          <CardDescription>
            Revise os físicos adicionados e suas sazonalizações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {physicals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum físico adicionado ainda.
            </p>
          ) : (
            physicals.map(physical => (
              <div
                key={physical.id}
                className="border border-border rounded-lg p-4 bg-slate-50"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-1">

                    {/* Plano + Carimbo */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Plano: {physical.plan}
                      </span>
                      {physical.carimboNome && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          <Tag className="h-3 w-3" />
                          {physical.carimboNome}
                        </span>
                      )}
                    </div>

                    <p className="font-medium text-foreground">{physical.description}</p>
                    <p className="text-sm text-muted-foreground">{physical.justification}</p>

                    <div className="mt-3">
                      <p className="text-sm font-semibold text-primary">
                        Valor do Físico: {formatBRL(physical.amount)}
                      </p>
                      {physical.seasonalization.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {physical.seasonalization.map(s => (
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
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Ações finais ── */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleSubmit}
          className="flex-1 bg-primary hover:bg-green-700 text-white text-lg py-6 disabled:opacity-60"
          disabled={physicals.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Enviando…
            </>
          ) : (
            "Enviar Solicitação"
          )}
        </Button>
        <Link href="/home" className="flex-1">
          <Button variant="outline" className="w-full text-lg py-6 bg-transparent">
            Cancelar
          </Button>
        </Link>
      </div>
    </div>
  )
}
