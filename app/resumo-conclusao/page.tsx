// app/resumo-conclusao/page.tsx
"use client"

import { useMemo, useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Wallet, Target, HardHat, LandPlot, ArrowLeft, RefreshCw, XCircle, ClipboardCheck, ChevronRight, Home } from "lucide-react"

// --- Tipos ---
type StatusCapex = "PENDENTE" | "FINALIZADO" | "PARCIAL"
type StatusFisico = "SIM" | "NAO" | "PENDENTE"

interface RawDataRow {
  id: string;
  meta: number;
  status_capex: StatusCapex;
  status_fisico: StatusFisico;
  tipo: string;
  natureza: string;
  plano_text: string;
  plano_investimento: string;
}

interface ApiResponse {
  ok: boolean;
  error?: string;
  updatedAt: string;
  rawData: RawDataRow[];
}

// Configuração da Hierarquia
const HIERARCHY_KEYS = ['tipo', 'natureza', 'plano_text', 'plano_investimento'] as const;
type HierarchyKey = typeof HIERARCHY_KEYS[number];

const HIERARCHY_LABELS: Record<HierarchyKey, string> = {
  tipo: "Tipo",
  natureza: "Natureza",
  plano_text: "Plano",
  plano_investimento: "Subplano"
};

// --- Constantes de Cores ---
const TEAL = "hsl(168 64% 42%)"; const AMBER = "hsl(38 92% 50%)"; const SLATE = "hsl(220 10% 46%)";
const RED = "hsl(0 72% 56%)"; const BLUE = "hsl(200 70% 50%)";
const PIE_COLORS_CAPEX: Record<string, string> = { Finalizado: TEAL, Parcial: AMBER, Pendente: SLATE };
const PIE_COLORS_FISICO: Record<string, string> = { SIM: TEAL, "NAO": RED, "Pendente Fisico": SLATE };

// --- Funções Helper ---
const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
const formatCompact = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(value);
const formatPercent = (value: number, total: number) => total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0%";

function StatusBadge({ status }: { status: StatusCapex | StatusFisico }) {
  switch (status) {
    case "FINALIZADO": return <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/20 font-medium">Finalizado</Badge>
    case "PARCIAL": return <Badge className="bg-secondary/15 text-secondary border-secondary/20 hover:bg-secondary/20 font-medium">Parcial</Badge>
    case "PENDENTE": return <Badge className="bg-muted text-muted-foreground border-border hover:bg-muted font-medium">Pendente</Badge>
    case "SIM": return <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/20 font-medium">Sim</Badge>
    case "NAO": return <Badge className="bg-accent/15 text-accent border-accent/20 hover:bg-accent/20 font-medium">Não</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-none shadow-sm"><CardContent className="p-5 space-y-3">
              <Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-32" /><Skeleton className="h-4 w-20" />
          </CardContent></Card>
        ))}
      </div>
      <Card className="border-none shadow-sm"><CardContent className="p-6"><Skeleton className="h-[300px] w-full rounded-lg" /></CardContent></Card>
    </div>
  )
}

// --- Componente Restaurado (Cards com Ícones Bonitos) ---
function DynamicKpiCards({ summary }: { summary: any }) {
  const cards = [
    { label: "Conclusão Financeira (Qtd)", value: `${summary.capexFinalizadoCount}`, sub: `de ${summary.totalSubplans} subplanos`, badge: formatPercent(summary.capexFinalizadoCount, summary.totalSubplans), icon: Wallet, iconBg: "bg-primary/10", iconColor: "text-primary", badgeClass: "bg-primary/15 text-primary border-primary/20" },
    { label: "Conclusão Financeira (Meta)", value: formatCurrency(summary.capexFinalizadoMeta), sub: `de ${formatCurrency(summary.totalMeta)}`, badge: formatPercent(summary.capexFinalizadoMeta, summary.totalMeta), icon: Target, iconBg: "bg-secondary/10", iconColor: "text-secondary", badgeClass: "bg-secondary/15 text-secondary border-secondary/20" },
    { label: "Conclusão Física (Qtd)", value: `${summary.fisicoSimCount}`, sub: `de ${summary.totalFisico} finalizados`, badge: formatPercent(summary.fisicoSimCount, summary.totalFisico), icon: HardHat, iconBg: "bg-accent/10", iconColor: "text-accent", badgeClass: "bg-accent/15 text-accent border-accent/20" },
    { label: "Conclusão Física (Meta)", value: formatCurrency(summary.fisicoSimMeta), sub: `de ${formatCurrency(summary.totalMetaFisico)}`, badge: formatPercent(summary.fisicoSimMeta, summary.totalMetaFisico), icon: LandPlot, iconBg: "bg-foreground/10", iconColor: "text-foreground", badgeClass: "bg-muted text-muted-foreground border-border" },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold tracking-tight text-card-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </div>
              <div className={`rounded-xl p-2.5 ${card.iconBg}`}><card.icon className={`h-5 w-5 ${card.iconColor}`} /></div>
            </div>
            <Badge variant="outline" className={`mt-3 ${card.badgeClass} text-xs`}>{card.badge} do escopo atual</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// --- Componente Principal da Página ---
export default function DashboardResumoConclusaoPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ESTADO DA HIERARQUIA: Controla onde o usuário clicou
  const [drilldownPath, setDrilldownPath] = useState<{ level: HierarchyKey; value: string }[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/capex/getsummary`, { signal: controller.signal, cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao carregar");
        setData(json);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, []);

  // MOTOR DE CÁLCULO E FILTRAGEM
  const processed = useMemo(() => {
    if (!data?.rawData) return null;

    let currentData = data.rawData;

    // 1. FILTRA OS DADOS baseando-se em onde o usuário clicou
    drilldownPath.forEach(step => {
      currentData = currentData.filter(row => row[step.level] === step.value);
    });

    // 2. DEFINE O NÍVEL ATUAL para os gráficos
    const currentLevelIndex = drilldownPath.length;
    const groupingKey = HIERARCHY_KEYS[Math.min(currentLevelIndex, HIERARCHY_KEYS.length - 1)];
    const canDrillDown = currentLevelIndex < HIERARCHY_KEYS.length - 1;
    const currentLevelLabel = HIERARCHY_LABELS[groupingKey];

    // 3. RECALCULA O SUMMARY (KPIs) baseado SOMENTE nos dados filtrados
    const summary = currentData.reduce((acc, row) => {
      acc.totalSubplans++;
      acc.totalMeta += row.meta;
      
      if (row.status_capex === 'FINALIZADO') { acc.capexFinalizadoCount++; acc.capexFinalizadoMeta += row.meta; }
      else if (row.status_capex === 'PARCIAL') { acc.capexParcialCount++; acc.capexParcialMeta += row.meta; }
      else { acc.capexPendenteCount++; acc.capexPendenteMeta += row.meta; }

      if (row.status_capex === 'FINALIZADO') {
        acc.totalFisico++;
        acc.totalMetaFisico += row.meta;
        if (row.status_fisico === 'SIM') { acc.fisicoSimCount++; acc.fisicoSimMeta += row.meta; }
        else if (row.status_fisico === 'NAO') { acc.fisicoNaoCount++; acc.fisicoNaoMeta += row.meta; }
        else { acc.fisicoPendCount++; acc.fisicoPendMeta += row.meta; }
      }
      return acc;
    }, {
      totalSubplans: 0, totalMeta: 0, capexFinalizadoCount: 0, capexFinalizadoMeta: 0, capexParcialCount: 0, capexParcialMeta: 0, capexPendenteCount: 0, capexPendenteMeta: 0,
      totalFisico: 0, totalMetaFisico: 0, fisicoSimCount: 0, fisicoSimMeta: 0, fisicoNaoCount: 0, fisicoNaoMeta: 0, fisicoPendCount: 0, fisicoPendMeta: 0
    });

    // 4. AGRUPA PARA OS GRÁFICOS DE BARRA
    const groupedMap = new Map<string, any>();
    currentData.forEach(row => {
      const keyVal = row[groupingKey];
      if (!groupedMap.has(keyVal)) {
        groupedMap.set(keyVal, { name: keyVal, totalMeta: 0, finalizadoMeta: 0, pendenteMeta: 0 });
      }
      const group = groupedMap.get(keyVal);
      group.totalMeta += row.meta;
      if (row.status_capex === 'FINALIZADO') group.finalizadoMeta += row.meta;
      else group.pendenteMeta += row.meta;
    });

    const chartData = Array.from(groupedMap.values())
      .map(item => ({ ...item, shortName: item.name.length > 25 ? `${item.name.substring(0, 25)}...` : item.name }))
      .sort((a, b) => b.totalMeta - a.totalMeta);

    // 5. DADOS PARA PIZZAS
    const capexStatusData = [
      { name: "Finalizado", value: summary.capexFinalizadoCount }, { name: "Parcial", value: summary.capexParcialCount }, { name: "Pendente", value: summary.capexPendenteCount }
    ].filter(d => d.value > 0);

    const fisicoStatusData = [
      { name: "SIM", value: summary.fisicoSimCount }, { name: "NAO", value: summary.fisicoNaoCount }, { name: "Pendente Fisico", value: summary.fisicoPendCount }
    ].filter(d => d.value > 0);

    return { summary, chartData, capexStatusData, fisicoStatusData, tableData: currentData, canDrillDown, groupingKey, currentLevelLabel };
  }, [data, drilldownPath]);

  // Função para lidar com o clique no gráfico
  const handleBarClick = (barData: any) => {
    if (processed?.canDrillDown) {
      setDrilldownPath([...drilldownPath, { level: processed.groupingKey, value: barData.name }]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* CABEÇALHO RESTAURADO COM O BOTÃO VOLTAR */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-primary-foreground"><ClipboardCheck className="h-5 w-5" /></div>
            <div>
              <h1 className="text-lg font-bold text-card-foreground leading-tight">Resumo CAPEX e Físico</h1>
              <p className="text-xs text-muted-foreground">{data?.updatedAt ? `Atualizado em ${new Date(data.updatedAt).toLocaleString("pt-BR")}` : "Carregando..."}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && (<RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />)}
            <Button variant="outline" size="sm" asChild className="gap-2 bg-transparent">
              <a href="/"><ArrowLeft className="h-4 w-4" />Voltar</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {error && (
           <Card className="border-accent/30 bg-accent/5 border-none shadow-sm"><CardContent className="p-5 flex gap-3 text-accent">
             <XCircle className="h-5 w-5 flex-shrink-0" />
             <div><p className="text-sm font-medium">Erro ao carregar dados</p><p className="text-xs mt-0.5">{error}</p></div>
           </CardContent></Card>
        )}
        {loading && !data && <LoadingSkeleton />}
        
        {data && processed && (
          <>
            {/* --- BREADCRUMB MELHORADO E MAIS DISCRETO --- */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span 
                className={`font-medium cursor-pointer transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md ${drilldownPath.length === 0 ? 'bg-primary/10 text-primary' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
                onClick={() => setDrilldownPath([])}
              >
                <Home className="h-4 w-4" /> Todos
              </span>
              
              {drilldownPath.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  <span 
                    className={`cursor-pointer transition-colors px-3 py-1.5 rounded-md ${index === drilldownPath.length - 1 ? 'bg-primary/10 text-primary font-semibold' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
                    onClick={() => setDrilldownPath(drilldownPath.slice(0, index + 1))}
                  >
                    {step.value}
                  </span>
                </div>
              ))}
            </div>

            {/* --- CARDS ORIGINAIS RESTAURADOS --- */}
            <DynamicKpiCards summary={processed.summary} />

            {/* --- GRÁFICOS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfico Barras: Progresso com Clique */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Progresso por {processed.currentLevelLabel}</CardTitle>
                  <CardDescription>{processed.canDrillDown ? "Clique em uma barra para detalhar o nível abaixo" : "Nível mais detalhado atingido"}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ChartContainer config={{}} className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processed.chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="shortName" tickLine={false} axisLine={false} width={150} tick={{ fontSize: 11 }} />
                        <ChartTooltip content={<ChartTooltipContent formatter={(val, name) => `${name === "Meta Finalizada" ? "Finalizado" : "Pendente"}: ${formatCurrency(val as number)}`} />} />
                        <Bar 
                          dataKey="finalizadoMeta" name="Meta Finalizada" fill={TEAL} stackId="a" 
                          cursor={processed.canDrillDown ? 'pointer' : 'default'} onClick={handleBarClick} 
                        />
                        <Bar 
                          dataKey="pendenteMeta" name="Meta Pendente" fill="hsl(220 14% 82%)" stackId="a" 
                          cursor={processed.canDrillDown ? 'pointer' : 'default'} onClick={handleBarClick} radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Gráficos de Pizza */}
              <div className="flex flex-col gap-4">
                 <Card className="border-none shadow-sm flex-1">
                   <CardContent className="p-4 flex h-[165px]">
                      <div className="w-1/2 flex flex-col justify-center">
                        <h3 className="font-semibold text-sm">Status Financeiro</h3>
                        <p className="text-xs text-muted-foreground mt-1">Distribuição do escopo atual</p>
                      </div>
                      <div className="w-1/2">
                        <ResponsiveContainer width="100%" height="100%"><PieChart>
                          <Pie data={processed.capexStatusData} innerRadius="60%" dataKey="value" strokeWidth={0}>
                            {processed.capexStatusData.map((e) => <Cell key={e.name} fill={PIE_COLORS_CAPEX[e.name]} />)}
                          </Pie>
                          <ChartTooltip />
                        </PieChart></ResponsiveContainer>
                      </div>
                   </CardContent>
                 </Card>

                 <Card className="border-none shadow-sm flex-1">
                   <CardContent className="p-4 flex h-[165px]">
                      <div className="w-1/2 flex flex-col justify-center">
                        <h3 className="font-semibold text-sm">Status Físico</h3>
                        <p className="text-xs text-muted-foreground mt-1">Base: apenas finalizados</p>
                      </div>
                      <div className="w-1/2">
                        <ResponsiveContainer width="100%" height="100%"><PieChart>
                          <Pie data={processed.fisicoStatusData} innerRadius="60%" dataKey="value" strokeWidth={0}>
                            {processed.fisicoStatusData.map((e) => <Cell key={e.name} fill={PIE_COLORS_FISICO[e.name]} />)}
                          </Pie>
                          <ChartTooltip />
                        </PieChart></ResponsiveContainer>
                      </div>
                   </CardContent>
                 </Card>
              </div>
            </div>

            {/* --- TABELA DE DETALHES --- */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Subplanos ({processed.tableData.length})</CardTitle>
                <CardDescription>Detalhes do nível atual selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm"><TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Natureza</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Subplano</TableHead>
                        <TableHead className="text-right">Meta</TableHead>
                        <TableHead className="text-center">Financ.</TableHead>
                        <TableHead className="text-center">Físico</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {processed.tableData.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Nenhum dado encontrado</TableCell></TableRow>
                      ) : (
                        processed.tableData.map((item) => (
                          <TableRow key={item.id} className="text-sm">
                            <TableCell className="text-muted-foreground whitespace-nowrap">{item.tipo}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">{item.natureza}</TableCell>
                            <TableCell className="font-medium truncate max-w-[200px]">{item.plano_text}</TableCell>
                            <TableCell className="truncate max-w-[200px]" title={item.plano_investimento}>{item.plano_investimento}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(item.meta)}</TableCell>
                            <TableCell className="text-center"><StatusBadge status={item.status_capex} /></TableCell>
                            <TableCell className="text-center">{item.status_capex === 'FINALIZADO' ? <StatusBadge status={item.status_fisico} /> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
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
      </main>
    </div>
  )
}
