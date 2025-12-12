"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";

interface Physical {
  id: string;
  description: string;
  justification: string;
}

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function Page() {
  const [investmentPlan, setInvestmentPlan] = useState("");
  const [value, setValue] = useState("");
  const [physicals, setPhysicals] = useState<Physical[]>([]);
  const [newPhysical, setNewPhysical] = useState({ description: "", justification: "" });
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());

  const handleAddPhysical = () => {
    if (newPhysical.description && newPhysical.justification) {
      setPhysicals((prev) => [...prev, { id: Date.now().toString(), ...newPhysical }]);
      setNewPhysical({ description: "", justification: "" });
    }
  };

  const handleRemovePhysical = (id: string) => {
    setPhysicals((prev) => prev.filter((p) => p.id !== id));
  };

  const handleMonthToggle = (month: string) => {
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      next.has(month) ? next.delete(month) : next.add(month);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!investmentPlan || !value || physicals.length === 0 || selectedMonths.size === 0) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    console.log({
      investmentPlan,
      value,
      physicals,
      seasonalization: Array.from(selectedMonths),
    });
    alert("Solicitação enviada com sucesso!");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-green-700 transition-colors mb-4">
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
          <p className="text-muted-foreground text-base ml-13">
            Solicite aprovação de recursos para seus planos de investimento
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais da solicitação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="plan">Plano de Investimento *</Label>
                  <Select value={investmentPlan} onValueChange={setInvestmentPlan}>
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
                  <Label htmlFor="value">Valor do Aporte (R$) *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-primary">R$</span>
                    <Input
                      id="value"
                      type="number"
                      placeholder="0,00"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes dos Físicos</CardTitle>
              <CardDescription>Adicione uma descrição e justificativa para cada item físico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 border-b border-border pb-6">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição do Físico *</Label>
                  <Textarea
                    id="description"
                    placeholder="Ex: Instalação de painéis solares na subestação X"
                    value={newPhysical.description}
                    onChange={(e) => setNewPhysical({ ...newPhysical, description: e.target.value })}
                    className="min-h-20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="justification">Justificativa *</Label>
                  <Textarea
                    id="justification"
                    placeholder="Ex: Aumentar capacidade de geração, reduzir custos operacionais"
                    value={newPhysical.justification}
                    onChange={(e) => setNewPhysical({ ...newPhysical, justification: e.target.value })}
                    className="min-h-20"
                  />
                </div>

                <Button onClick={handleAddPhysical} className="w-full bg-primary hover:bg-green-700 text-white flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Físico
                </Button>
              </div>

              {physicals.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Físicos Adicionados ({physicals.length})</h4>
                  {physicals.map((physical) => (
                    <div key={physical.id} className="border border-border rounded-lg p-4 bg-slate-50">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <p className="font-medium text-foreground">{physical.description}</p>
                          <p className="text-sm text-muted-foreground">{physical.justification}</p>
                        </div>
                        <Button onClick={() => handleRemovePhysical(physical.id)} variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Previsão de Sazonalização</CardTitle>
              <CardDescription>Selecione os meses em que o recurso será realizado *</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {months.map((month) => (
                  <div key={month} className="flex items-center space-x-2">
                    <Checkbox id={month} checked={selectedMonths.has(month)} onCheckedChange={() => handleMonthToggle(month)} />
                    <Label htmlFor={month} className="cursor-pointer text-sm font-medium">
                      {month}
                    </Label>
                  </div>
                ))}
              </div>

              {selectedMonths.size > 0 && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-muted-foreground mb-2">Meses selecionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {months.map(
                      (month) =>
                        selectedMonths.has(month) && (
                          <span key={month} className="inline-flex items-center px-3 py-1 rounded-full bg-primary text-white text-sm font-medium">
                            {month}
                          </span>
                        ),
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} className="flex-1 bg-primary hover:bg-green-700 text-white text-lg py-6">
              Enviar Solicitação
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full text-lg py-6 bg-transparent">
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
