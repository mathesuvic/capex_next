// app/resumo-conclusao/page.tsx
"use client"

import { useMemo, useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// --- Tipos (Seu código original aqui estava perfeito) ---
type StatusCapex = 'PENDENTE' | 'FINALIZADO' | 'PARCIAL';
type StatusFisico = 'SIM' | 'NAO' | 'PENDENTE';

interface SummaryData {
    totalSubplans: number;
    totalMeta: number;
    capexFinalizadoCount: number;
    capexFinalizadoMeta: number;
    capexParcialCount: number;
    capexParcialMeta: number;
    capexPendenteCount: number;
    capexPendenteMeta: number;
    totalFinalizadosParaFisico: number;
    totalMetaFinalizadosParaFisico: number;
    fisicoSimCount: number;
    fisicoSimMeta: number;
    fisicoNaoCount: number;
    fisicoNaoMeta: number;
    fisicoPendenteCount: number;
    fisicoPendenteMeta: number;
}
interface PlanData {
    name: string;
    totalMeta: number;
    finalizadoMeta: number;
    totalCount: number;
    finalizadoCount: number;
    // ✅ CORREÇÃO: Novo campo para o gráfico de barras empilhadas
    pendenteMeta: number; 
}
interface SubplanDetail {
    label: string;
    plano: string;
    meta: number;
    status_capex: StatusCapex;
    status_fisico: StatusFisico;
}
interface ApiResponse {
    ok: boolean;
    error?: string;
    updatedAt: string;
    summary: SummaryData;
    byPlan: PlanData[];
    subplanDetails: SubplanDetail[];
}

const PIE_COLORS = {
  FINALIZADO: "hsl(var(--chart-1))",
  PARCIAL: "hsl(var(--chart-2))",
  PENDENTE: "hsl(var(--chart-3))",
  SIM: "hsl(var(--chart-1))",
  NAO: "hsl(var(--chart-5))",
};

export default function DashboardResumoConclusaoPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // ✅ CORREÇÃO: Usando variável de ambiente para a URL da API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/capex/getsummary`, { signal: controller.signal });
        
        const json = (await res.json()) as ApiResponse;
        if (!res.ok || !json?.ok) throw new Error(json?.error || `Falha ao carregar (${res.status})`);
        setData(json);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e?.message || "Erro ao carregar resumo");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const processedData = useMemo(() => {
    if (!data) return null;

    const { summary, byPlan } = data;
    const capexStatusData = [
        { name: 'Finalizado', value: summary.capexFinalizadoCount, fill: PIE_COLORS.FINALIZADO },
        { name: 'Parcial', value: summary.capexParcialCount, fill: PIE_COLORS.PARCIAL },
        { name: 'Pendente', value: summary.capexPendenteCount, fill: PIE_COLORS.PENDENTE },
    ].filter(d => d.value > 0);
    
    const fisicoStatusData = [
        { name: 'SIM', value: summary.fisicoSimCount, fill: PIE_COLORS.SIM },
        { name: 'NÃO', value: summary.fisicoNaoCount, fill: PIE_COLORS.NAO },
        { name: 'Pendente Físico', value: summary.fisicoPendenteCount, fill: PIE_COLORS.PENDENTE },
    ].filter(d => d.value > 0);

    // ✅ CORREÇÃO: Processando dados para o gráfico de barras empilhadas
    const byPlanStacked = byPlan.map(plan => ({
      ...plan,
      pendenteMeta: plan.totalMeta - plan.finalizadoMeta,
    }));

    return { capexStatusData, fisicoStatusData, byPlanStacked };
  }, [data]);

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  const formatPercent = (value: number, total: number) => total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%';

  const getStatusBadge = (status: StatusCapex | StatusFisico) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      FINALIZADO: { label: "Finalizado", className: "bg-emerald-600" },
      PENDENTE: { label: "Pendente", className: "bg-slate-500" },
      PARCIAL: { label: "Parcial", className: "bg-yellow-500" },
      SIM: { label: "Sim", className: "bg-emerald-600" },
      NAO: { label: "Não", className: "bg-red-600" },
    };
    const { label, className } = statusMap[status] || { label: status, className: "bg-gray-400" };
    return <Badge className={`${className} hover:${className} text-white text-xs`}>{label}</Badge>;
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Carregando dados...</div>
  if (error) return <div className="p-6 text-center text-red-600"><strong>Erro:</strong> {error}</div>
  if (!data || !processedData) return <div className="p-6 text-center">Nenhum dado encontrado.</div>

  const { summary, subplanDetails, updatedAt } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Resumo de Conclusão CAPEX</h1>
          <p className="text-slate-600">Análise do progresso de finalização financeira e física dos subplanos.</p>
          <p className="text-xs text-slate-500 mt-1">Atualizado em: {new Date(updatedAt).toLocaleString("pt-BR")}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <CardHeader>
                    <CardDescription>Conclusão Financeira (Qtd)</CardDescription>
                    <CardTitle className="text-3xl">{summary.capexFinalizadoCount} <span className="text-lg text-slate-500">de {summary.totalSubplans}</span></CardTitle>
                </CardHeader>
                <CardContent><p className="text-lg font-bold text-emerald-600">{formatPercent(summary.capexFinalizadoCount, summary.totalSubplans)}</p></CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardDescription>Conclusão Financeira (Meta)</CardDescription>
                    <CardTitle className="text-3xl">{formatCurrency(summary.capexFinalizadoMeta)}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-lg font-bold text-emerald-600">{formatPercent(summary.capexFinalizadoMeta, summary.totalMeta)} de {formatCurrency(summary.totalMeta)}</p></CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardDescription>Conclusão Física (Qtd)</CardDescription>
                    <CardTitle className="text-3xl">{summary.fisicoSimCount} <span className="text-lg text-slate-500">de {summary.totalFinalizadosParaFisico}</span></CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-slate-500">Dos {summary.totalFinalizadosParaFisico} subplanos finalizados, {formatPercent(summary.fisicoSimCount, summary.totalFinalizadosParaFisico)} estão 100% detalhados.</p></CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardDescription>Conclusão Física (Meta)</CardDescription>
                    <CardTitle className="text-3xl">{formatCurrency(summary.fisicoSimMeta)}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-slate-500">Representando {formatPercent(summary.fisicoSimMeta, summary.totalMetaFinalizadosParaFisico)} da meta dos finalizados.</p></CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Distribuição por Status (Financeiro)</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ChartContainer config={{}} className="h-[250px] w-full max-w-[250px]">
                    <ResponsiveContainer><PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => `${value} subplanos`} />} />
                        <Pie data={processedData.capexStatusData} dataKey="value" nameKey="name" innerRadius={60}>{processedData.capexStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart></ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Distribuição por Status (Físico)</CardTitle><CardDescription>Base: Apenas subplanos com status financeiro "Finalizado".</CardDescription></CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ChartContainer config={{}} className="h-[250px] w-full max-w-[250px]">
                    <ResponsiveContainer><PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => `${value} subplanos`} />} />
                        <Pie data={processedData.fisicoStatusData} dataKey="value" nameKey="name" innerRadius={60}>{processedData.fisicoStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart></ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Progresso por Plano de Investimento</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[400px] w-full">
              <ResponsiveContainer>
                {/* ✅ CORREÇÃO: Gráfico de barras transformado em empilhado (stacked) para melhor visualização */}
                <BarChart data={processedData.byPlanStacked} layout="vertical" margin={{ left: 150 }}>
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={250} className="text-xs" />
                  <XAxis type="number" hide />
                  <Tooltip content={<ChartTooltipContent formatter={(value, name) => `${name === 'pendenteMeta' ? 'Pendente:' : 'Finalizado:'} ${formatCurrency(Number(value))}`} />} />
                  <Legend />
                  <Bar dataKey="finalizadoMeta" name="Meta Finalizada" fill="hsl(var(--primary))" radius={4} stackId="a" />
                  <Bar dataKey="pendenteMeta" name="Meta Pendente" fill="hsl(var(--secondary))" radius={4} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Detalhes dos Subplanos</CardTitle><CardDescription>{subplanDetails.length} itens no total</CardDescription></CardHeader>
          <CardContent className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano de Investimento</TableHead>
                  <TableHead>Subplano</TableHead>
                  <TableHead className="text-right">Meta</TableHead>
                  <TableHead className="text-center">Status Financeiro</TableHead>
                  <TableHead className="text-center">Status Físico</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subplanDetails.map((item) => (
                  <TableRow key={item.label}>
                    <TableCell className="font-medium text-slate-600">{item.plano}</TableCell>
                    <TableCell className="font-semibold">{item.label}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.meta)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(item.status_capex)}</TableCell>
                    <TableCell className="text-center">{item.status_capex === 'FINALIZADO' ? getStatusBadge(item.status_fisico) : <span className="text-xs text-slate-400">N/A</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
