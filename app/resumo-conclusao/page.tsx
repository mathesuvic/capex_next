// app/resumo-conclusao/page.tsx
"use client"

import { useMemo, useEffect, useState, useCallback } from "react"
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, XAxis, YAxis, Legend, LabelList, Tooltip
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Wallet, Target, HardHat, LandPlot, ArrowLeft, RefreshCw,
  XCircle, ChevronRight, Home, AlertTriangle, CheckCircle2,
  Minus, BarChart3, PieChart as PieChartIcon, TableIcon, Zap,
  ArrowUpDown, ArrowUp, ArrowDown, Search, X, SlidersHorizontal
} from "lucide-react"

// ─── Tipos ───────────────────────────────────────────────────────────────────
type StatusCapex  = "PENDENTE" | "FINALIZADO" | "PARCIAL"
type StatusFisico = "SIM" | "NAO" | "PENDENTE"
type SortKey      = "tipo" | "natureza" | "plano_text" | "plano_investimento" | "meta" | "peso" | "status_capex" | "status_fisico"
type SortDir      = "asc" | "desc" | null

interface RawDataRow {
  id: string; meta: number;
  status_capex: StatusCapex; status_fisico: StatusFisico;
  tipo: string; natureza: string; plano_text: string; plano_investimento: string;
}
interface ApiResponse {
  ok: boolean; error?: string; updatedAt: string; rawData: RawDataRow[];
}

// ─── Hierarquia ──────────────────────────────────────────────────────────────
const HIERARCHY_KEYS   = ['tipo','natureza','plano_text','plano_investimento'] as const
type  HierarchyKey     = typeof HIERARCHY_KEYS[number]
const HIERARCHY_LABELS : Record<HierarchyKey,string> = {
  tipo:'Tipo', natureza:'Natureza', plano_text:'Plano', plano_investimento:'Subplano'
}

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  teal : "hsl(168 64% 42%)",
  amber: "hsl(38 92% 50%)",
  slate: "hsl(220 10% 46%)",
  red  : "hsl(0 72% 56%)",
  blue : "hsl(200 70% 50%)",
}
const PIE_CAPEX  : Record<string,string> = { Finalizado:C.teal, Parcial:C.amber, Pendente:C.slate }
const PIE_FISICO : Record<string,string> = { SIM:C.teal, NAO:C.red, "Pendente Fisico":C.slate }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtBRL  = (v:number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:0,maximumFractionDigits:0}).format(v)
const fmtCpct = (v:number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",notation:"compact",maximumFractionDigits:1}).format(v)
const fmtPct  = (v:number,t:number) => t>0 ? `${((v/t)*100).toFixed(1)}%` : "0%"
const pctNum  = (v:number,t:number) => t>0 ? (v/t)*100 : 0

// ─── Rótulo Pizza ─────────────────────────────────────────────────────────────
const PieLabel = (p:any) => {
  const {cx,cy,midAngle,innerRadius,outerRadius,percent,fill} = p
  if (!p||percent<0.03) return null
  const r=innerRadius+(outerRadius-innerRadius)*0.5
  const x=cx+r*Math.cos(-midAngle*Math.PI/180)
  const y=cy+r*Math.sin(-midAngle*Math.PI/180)
  const txt=`${(percent*100).toFixed(0)}%`
  const w=txt.length>3?36:30
  return (
    <g>
      <rect x={x-w/2} y={y-10} width={w} height={20} fill={fill} rx={6} stroke="#fff" strokeWidth={2}/>
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>{txt}</text>
    </g>
  )
}

// ─── Rótulo Barra ─────────────────────────────────────────────────────────────
const BarLabel = (p:any) => {
  const {x,y,height,value,payload} = p
  if (!value||typeof x!=='number'||typeof y!=='number'||!payload) return null
  const total=payload.totalMeta||0
  const done =payload.finalizadoMeta||0
  const pct  =total>0?done/total:0
  const isSmall=pct<0.12
  const w=value.length>3?36:30
  const cx=isSmall?x+w/2+5:x-w/2-5
  const cy=y+(height??0)/2
  return (
    <g>
      <rect x={cx-w/2} y={cy-10} width={w} height={20} fill={C.teal} rx={6} stroke="#fff" strokeWidth={2}/>
      <text x={cx} y={cy} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>{value}</text>
    </g>
  )
}

// ─── Tooltip Barra ────────────────────────────────────────────────────────────
const RichBarTooltip = ({active,payload}:any) => {
  if (!active||!payload?.length) return null
  const d=payload[0]?.payload
  if (!d) return null
  const pct=d.totalMeta>0?((d.finalizadoMeta/d.totalMeta)*100).toFixed(1):'0'
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl p-4 min-w-[220px]">
      <p className="font-semibold text-card-foreground text-sm mb-3 pb-2 border-b border-border truncate">{d.name}</p>
      <div className="space-y-2">
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Meta Total</span><span className="font-mono font-medium">{fmtBRL(d.totalMeta)}</span></div>
        <div className="flex justify-between text-xs"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary inline-block"/>Realizado</span><span className="font-mono font-medium text-primary">{fmtBRL(d.finalizadoMeta)}</span></div>
        <div className="flex justify-between text-xs"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block"/>Pendente</span><span className="font-mono font-medium text-muted-foreground">{fmtBRL(d.pendenteMeta)}</span></div>
        <div className="mt-3 pt-2 border-t border-border">
          <div className="flex justify-between text-xs mb-1.5"><span className="text-muted-foreground font-medium">Conclusão</span><span className="font-bold text-primary">{pct}%</span></div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{width:`${pct}%`}}/></div>
        </div>
      </div>
    </div>
  )
}

// ─── Badge Status ─────────────────────────────────────────────────────────────
function StatusBadge({status}:{status:StatusCapex|StatusFisico}) {
  const cfg:{[k:string]:{cls:string,icon:any,label:string}} = {
    FINALIZADO:{cls:"bg-primary/10 text-primary border-primary/20",       icon:CheckCircle2, label:"Finalizado"},
    PARCIAL   :{cls:"bg-amber-500/10 text-amber-600 border-amber-500/20", icon:AlertTriangle,label:"Parcial"},
    PENDENTE  :{cls:"bg-muted text-muted-foreground border-border",        icon:Minus,        label:"Pendente"},
    SIM       :{cls:"bg-primary/10 text-primary border-primary/20",       icon:CheckCircle2, label:"Sim"},
    NAO       :{cls:"bg-red-500/10 text-red-600 border-red-500/20",       icon:XCircle,      label:"Não"},
  }
  const c=cfg[status]
  if (!c) return <Badge variant="outline">{status}</Badge>
  const Icon=c.icon
  return <Badge variant="outline" className={`${c.cls} font-medium gap-1 text-xs whitespace-nowrap`}><Icon className="h-3 w-3"/>{c.label}</Badge>
}

// ─── Gauge SVG ────────────────────────────────────────────────────────────────
function ExecutiveGauge({pct,label,sublabel}:{pct:number,label:string,sublabel:string}) {
  const r=54; const circ=2*Math.PI*r; const offset=circ*(1-Math.min(pct,100)/100)
  const color=pct>=80?C.teal:pct>=40?C.amber:C.red
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(220 14% 90%)" strokeWidth="12"/>
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 70 70)" style={{transition:"stroke-dashoffset 1s ease"}}/>
        <text x="70" y="64" textAnchor="middle" fontSize="22" fontWeight="800" fill={color}>{pct.toFixed(0)}%</text>
        <text x="70" y="84" textAnchor="middle" fontSize="10" fill="hsl(220 10% 55%)">{label}</text>
      </svg>
      <p className="text-[11px] text-muted-foreground text-center leading-tight mt-1">{sublabel}</p>
    </div>
  )
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────
function KpiCards({summary}:{summary:any}) {
  const p1=pctNum(summary.capexFinalizadoCount,summary.totalSubplans)
  const p2=pctNum(summary.capexFinalizadoMeta, summary.totalMeta)
  const p3=pctNum(summary.fisicoSimCount,      summary.totalFisico)
  const p4=pctNum(summary.fisicoSimMeta,       summary.totalMetaFisico)
  const barColor=(p:number)=>p>=80?"bg-primary":p>=40?"bg-amber-500":"bg-red-500"
  const txtColor=(p:number)=>p>=80?"text-primary":p>=40?"text-amber-600":"text-red-600"
  const cards=[
    {label:"Conclusão Financeira",sub:"Subplanos finalizados",    value:`${summary.capexFinalizadoCount} / ${summary.totalSubplans}`, pct:p1, icon:Wallet,  iconBg:"bg-primary/10",   iconColor:"text-primary",   detail:`${p1.toFixed(1)}% do escopo`},
    {label:"Volume Financeiro",   sub:"Meta executada (R$)",      value:fmtCpct(summary.capexFinalizadoMeta),                         pct:p2, icon:Target,  iconBg:"bg-amber-500/10", iconColor:"text-amber-600", detail:`de ${fmtCpct(summary.totalMeta)}`},
    {label:"Entrega Física",      sub:"Projetos entregues",       value:`${summary.fisicoSimCount} / ${summary.totalFisico}`,         pct:p3, icon:HardHat, iconBg:"bg-blue-500/10",  iconColor:"text-blue-600",  detail:`${p3.toFixed(1)}% dos finalizados`},
    {label:"Volume Físico",       sub:"Meta dos projetos entregues",value:fmtCpct(summary.fisicoSimMeta),                            pct:p4, icon:LandPlot,iconBg:"bg-violet-500/10",iconColor:"text-violet-600",detail:`de ${fmtCpct(summary.totalMetaFisico)}`},
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(card=>(
        <Card key={card.label} className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-200">
          <div className={`absolute top-0 left-0 right-0 h-0.5 ${barColor(card.pct)}`}/>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p><p className="text-[10px] text-muted-foreground/70 mt-0.5">{card.sub}</p></div>
              <div className={`rounded-xl p-2.5 ${card.iconBg}`}><card.icon className={`h-4 w-4 ${card.iconColor}`}/></div>
            </div>
            <p className="text-xl font-bold tracking-tight text-card-foreground mb-3">{card.value}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">{card.detail}</span><span className={`font-bold ${txtColor(card.pct)}`}>{card.pct.toFixed(1)}%</span></div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ${barColor(card.pct)}`} style={{width:`${card.pct}%`}}/></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(4)].map((_,i)=><Card key={i} className="border-none shadow-sm"><CardContent className="p-4 space-y-3"><Skeleton className="h-8 w-8 rounded-lg"/><Skeleton className="h-5 w-24"/><Skeleton className="h-1.5 w-full rounded-full"/></CardContent></Card>)}</div>
      <Card className="border-none shadow-sm"><CardContent className="p-4"><Skeleton className="h-[380px] rounded-lg"/></CardContent></Card>
    </div>
  )
}

// ─── Cabeçalho Ordenável ──────────────────────────────────────────────────────
function SortableHead({col,label,currentSort,onSort,className=""}:{col:SortKey,label:string,currentSort:{key:SortKey|null,dir:SortDir},onSort:(k:SortKey)=>void,className?:string}) {
  const active=currentSort.key===col
  return (
    <TableHead
      className={`text-xs font-bold uppercase tracking-wide cursor-pointer select-none hover:bg-muted/50 transition-colors ${className}`}
      onClick={()=>onSort(col)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {active && currentSort.dir==='asc'  && <ArrowUp   className="h-3 w-3 text-primary"/>}
        {active && currentSort.dir==='desc' && <ArrowDown  className="h-3 w-3 text-primary"/>}
        {!active && <ArrowUpDown className="h-3 w-3 text-muted-foreground/40"/>}
      </div>
    </TableHead>
  )
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function DashboardResumoConclusaoPage() {
  const [data,    setData   ] = useState<ApiResponse|null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError  ] = useState<string|null>(null)
  const [drilldownPath, setDrilldownPath] = useState<{level:HierarchyKey,value:string}[]>([])

  // ── Estado de ordenação e filtros da tabela
  const [sort,       setSort      ] = useState<{key:SortKey|null,dir:SortDir}>({key:null,dir:null})
  const [searchText, setSearchText] = useState("")
  const [filterCapex,  setFilterCapex ] = useState<string>("todos")
  const [filterFisico, setFilterFisico] = useState<string>("todos")
  const [showFilters,  setShowFilters ] = useState(false)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(()=>{
    const ctrl=new AbortController()
    ;(async()=>{
      try {
        setLoading(true)
        const res =await fetch('/api/capex/getsummary',{signal:ctrl.signal,cache:'no-store'})
        const json=await res.json()
        if (!res.ok||!json?.ok) throw new Error(json?.error||'Falha ao carregar')
        setData(json)
      } catch(e:any){ if(e.name!=='AbortError') setError(e?.message) }
      finally { setLoading(false) }
    })()
    return ()=>ctrl.abort()
  },[])

  // ── Handler de ordenação ───────────────────────────────────────────────────
  const handleSort = useCallback((key:SortKey)=>{
    setSort(prev=>{
      if (prev.key!==key) return {key,dir:'asc'}
      if (prev.dir==='asc')  return {key,dir:'desc'}
      return {key:null,dir:null}
    })
  },[])

  // ── Processamento de dados (KPIs + gráficos) ───────────────────────────────
  const processed = useMemo(()=>{
    if (!data?.rawData) return null
    let cur=data.rawData
    drilldownPath.forEach(s=>{ cur=cur.filter(r=>r[s.level]===s.value) })

    const idx        =drilldownPath.length
    const groupingKey=HIERARCHY_KEYS[Math.min(idx,HIERARCHY_KEYS.length-1)]
    const canDrill   =idx<HIERARCHY_KEYS.length-1

    const summary=cur.reduce((acc,row)=>{
      acc.totalSubplans++; acc.totalMeta+=row.meta
      if      (row.status_capex==='FINALIZADO'){acc.capexFinalizadoCount++;acc.capexFinalizadoMeta+=row.meta}
      else if (row.status_capex==='PARCIAL')   {acc.capexParcialCount++;  acc.capexParcialMeta+=row.meta}
      else                                      {acc.capexPendenteCount++; acc.capexPendenteMeta+=row.meta}
      if (row.status_capex==='FINALIZADO'){
        acc.totalFisico++;acc.totalMetaFisico+=row.meta
        if      (row.status_fisico==='SIM'){acc.fisicoSimCount++;acc.fisicoSimMeta+=row.meta}
        else if (row.status_fisico==='NAO'){acc.fisicoNaoCount++;acc.fisicoNaoMeta+=row.meta}
        else                               {acc.fisicoPendCount++;acc.fisicoPendMeta+=row.meta}
      }
      return acc
    },{totalSubplans:0,totalMeta:0,capexFinalizadoCount:0,capexFinalizadoMeta:0,capexParcialCount:0,capexParcialMeta:0,capexPendenteCount:0,capexPendenteMeta:0,totalFisico:0,totalMetaFisico:0,fisicoSimCount:0,fisicoSimMeta:0,fisicoNaoCount:0,fisicoNaoMeta:0,fisicoPendCount:0,fisicoPendMeta:0} as any)

    const map=new Map<string,any>()
    cur.forEach(row=>{
      const k=row[groupingKey]
      if (!map.has(k)) map.set(k,{name:k,totalMeta:0,finalizadoMeta:0,pendenteMeta:0})
      const g=map.get(k)!
      g.totalMeta+=row.meta
      if (row.status_capex==='FINALIZADO') g.finalizadoMeta+=row.meta
      else g.pendenteMeta+=row.meta
    })

    const chartData=[...map.values()]
      .map(item=>{const p=item.totalMeta>0?Math.round((item.finalizadoMeta/item.totalMeta)*100):0;return {...item,shortName:item.name.length>28?item.name.slice(0,28)+'…':item.name,pctFormatted:p>0?`${p}%`:''}})
      .sort((a,b)=>b.totalMeta-a.totalMeta)

    const capexPie =[{name:"Finalizado",value:summary.capexFinalizadoCount},{name:"Parcial",value:summary.capexParcialCount},{name:"Pendente",value:summary.capexPendenteCount}].filter(d=>d.value>0)
    const fisicoPie=[{name:"SIM",value:summary.fisicoSimCount},{name:"NAO",value:summary.fisicoNaoCount},{name:"Pendente Fisico",value:summary.fisicoPendCount}].filter(d=>d.value>0)

    return {summary,chartData,capexPie,fisicoPie,tableData:cur,canDrill,groupingKey,levelLabel:HIERARCHY_LABELS[groupingKey],globalPct:pctNum(summary.capexFinalizadoMeta,summary.totalMeta),globalFisicoPct:pctNum(summary.fisicoSimMeta,summary.totalMetaFisico)}
  },[data,drilldownPath])

  // ── Tabela: filtrar + ordenar (derivado de processed) ─────────────────────
  const tableRows = useMemo(()=>{
    if (!processed) return []
    const totalMeta=processed.summary.totalMeta||1

    let rows=processed.tableData.map(row=>({
      ...row,
      peso: (row.meta/totalMeta)*100
    }))

    // Filtro de texto
    if (searchText.trim()){
      const q=searchText.toLowerCase()
      rows=rows.filter(r=>
        r.tipo.toLowerCase().includes(q)||
        r.natureza.toLowerCase().includes(q)||
        r.plano_text.toLowerCase().includes(q)||
        r.plano_investimento.toLowerCase().includes(q)
      )
    }

    // Filtro status capex
    if (filterCapex!=='todos') rows=rows.filter(r=>r.status_capex===filterCapex)

    // Filtro status fisico
    if (filterFisico!=='todos') rows=rows.filter(r=>r.status_fisico===filterFisico)

    // Ordenação
    if (sort.key&&sort.dir){
      rows=[...rows].sort((a,b)=>{
        let va:any=a[sort.key as keyof typeof a]
        let vb:any=b[sort.key as keyof typeof b]
        if (sort.key==='peso') { va=a.peso; vb=b.peso }
        if (typeof va==='string') va=va.toLowerCase()
        if (typeof vb==='string') vb=vb.toLowerCase()
        if (va<vb) return sort.dir==='asc'?-1:1
        if (va>vb) return sort.dir==='asc'?1:-1
        return 0
      })
    }

    return rows
  },[processed,searchText,filterCapex,filterFisico,sort])

  const handleBarClick=(d:any)=>{
    if (processed?.canDrill) setDrilldownPath([...drilldownPath,{level:processed.groupingKey,value:d.name}])
  }

  const clearFilters=()=>{ setSearchText(""); setFilterCapex("todos"); setFilterFisico("todos"); setSort({key:null,dir:null}) }
  const hasActiveFilters=searchText||filterCapex!=='todos'||filterFisico!=='todos'

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/30">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Zap className="h-5 w-5"/>
            </div>
            <div>
              <h1 className="text-base font-bold text-card-foreground leading-tight">CAPEX & Físico — Painel Executivo</h1>
              <p className="text-[11px] text-muted-foreground">
                {data?.updatedAt?`Atualizado em ${new Date(data.updatedAt).toLocaleString("pt-BR")}`:"Carregando…"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading&&<RefreshCw className="h-4 w-4 text-muted-foreground animate-spin"/>}
            <Button variant="outline" size="sm" asChild className="gap-2 h-8 text-xs">
              <a href="/capex"><ArrowLeft className="h-3.5 w-3.5"/>Voltar</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">

        {/* Erro */}
        {error&&(
          <Card className="border-red-200 bg-red-50 shadow-none">
            <CardContent className="p-4 flex gap-3 text-red-700">
              <AlertTriangle className="h-5 w-5 flex-shrink-0"/>
              <div><p className="text-sm font-semibold">Falha ao carregar dados</p><p className="text-xs mt-0.5">{error}</p></div>
            </CardContent>
          </Card>
        )}

        {loading&&!data&&<LoadingSkeleton/>}

        {data&&processed&&(
          <>
            {/* ── Breadcrumb ── */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button onClick={()=>setDrilldownPath([])} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${drilldownPath.length===0?'bg-primary text-primary-foreground shadow-sm':'bg-card text-muted-foreground hover:bg-muted border border-border'}`}>
                <Home className="h-3.5 w-3.5"/>Todos os Níveis
              </button>
              {drilldownPath.map((s,i)=>(
                <div key={i} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40"/>
                  <button onClick={()=>setDrilldownPath(drilldownPath.slice(0,i+1))} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${i===drilldownPath.length-1?'bg-primary text-primary-foreground shadow-sm':'bg-card text-muted-foreground hover:bg-muted border border-border'}`}>
                    {s.value}
                  </button>
                </div>
              ))}
            </div>

            {/* ── KPIs ── */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5"/>Indicadores de Desempenho</p>
              <KpiCards summary={processed.summary}/>
            </section>

            {/* ── Gráficos ── */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><PieChartIcon className="h-3.5 w-3.5"/>Análise Visual · {processed.levelLabel}</p>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">

                {/* Barras */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-0 pt-4 px-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">Progresso por {processed.levelLabel}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">{processed.canDrill?"↓ Clique em uma barra para detalhar":"Nível máximo atingido"}</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-primary/5">{processed.chartData.length} {processed.levelLabel.toLowerCase()}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 pt-2">
                    <ChartContainer config={{}} className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={processed.chartData} layout="vertical" margin={{top:4,left:0,right:42,bottom:4}}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(220 14% 93%)"/>
                          <XAxis type="number" hide/>
                          <YAxis type="category" dataKey="shortName" tickLine={false} axisLine={false} width={140} tick={{fontSize:11,fill:"hsl(220 10% 46%)"}}/>
                          <Tooltip content={<RichBarTooltip/>} cursor={{fill:'hsl(220 14% 96%)'}}/>
                          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{fontSize:'11px',paddingBottom:'12px'}} formatter={(v)=>v==="Meta Finalizada"?"Realizado":"Pendente"}/>
                          <Bar dataKey="finalizadoMeta" name="Meta Finalizada" fill={C.teal} stackId="a" cursor={processed.canDrill?'pointer':'default'} onClick={handleBarClick} radius={[3,0,0,3]}/>
                          <Bar dataKey="pendenteMeta" name="Meta Pendente" fill="hsl(220 14% 88%)" stackId="a" cursor={processed.canDrill?'pointer':'default'} onClick={handleBarClick} radius={[0,4,4,0]}>
                            <LabelList dataKey="pctFormatted" content={<BarLabel/>}/>
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Gauges */}
                <div className="flex flex-col gap-4 justify-center py-4">
                  <Card className="border-none shadow-sm"><CardContent className="p-5"><ExecutiveGauge pct={processed.globalPct} label="Financeiro" sublabel={`${fmtCpct(processed.summary.capexFinalizadoMeta)} de ${fmtCpct(processed.summary.totalMeta)}`}/></CardContent></Card>
                  <Card className="border-none shadow-sm"><CardContent className="p-5"><ExecutiveGauge pct={processed.globalFisicoPct} label="Físico" sublabel={`${processed.summary.fisicoSimCount} de ${processed.summary.totalFisico} entregues`}/></CardContent></Card>
                </div>

                {/* Pizzas */}
                <div className="flex flex-col gap-4">
                  {/* Pizza Financeiro */}
                  <Card className="border-none shadow-sm flex-1">
                    <CardContent className="p-5 flex gap-4 min-h-[190px]">
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <p className="font-semibold text-sm">Status Financeiro</p>
                        <p className="text-xs text-muted-foreground mt-0.5 mb-3">Composição por quantidade</p>
                        <div className="space-y-2">
                          {processed.capexPie.map(d=>(
                            <div key={d.name} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{backgroundColor:PIE_CAPEX[d.name]}}/><span className="text-muted-foreground">{d.name}</span></span>
                                <span className="font-semibold tabular-nums">{fmtPct(d.value,processed.summary.totalSubplans)}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1 overflow-hidden"><div className="h-full rounded-full" style={{width:fmtPct(d.value,processed.summary.totalSubplans),backgroundColor:PIE_CAPEX[d.name]}}/></div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="w-[120px] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart><Pie data={processed.capexPie} innerRadius="48%" outerRadius="82%" dataKey="value" strokeWidth={3} stroke="hsl(var(--background))" labelLine={false} label={PieLabel}>{processed.capexPie.map(e=><Cell key={e.name} fill={PIE_CAPEX[e.name]}/>)}</Pie><Tooltip/></PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pizza Físico */}
                  <Card className="border-none shadow-sm flex-1">
                    <CardContent className="p-5 flex gap-4 min-h-[190px]">
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <p className="font-semibold text-sm">Status Físico</p>
                        <p className="text-xs text-muted-foreground mt-0.5 mb-3">Base: projetos financ. concluídos</p>
                        <div className="space-y-2">
                          {processed.fisicoPie.map(d=>(
                            <div key={d.name} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{backgroundColor:PIE_FISICO[d.name]}}/><span className="text-muted-foreground">{d.name==="NAO"?"Não":d.name==="Pendente Fisico"?"Pendente":d.name}</span></span>
                                <span className="font-semibold tabular-nums">{fmtPct(d.value,processed.summary.totalFisico)}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1 overflow-hidden"><div className="h-full rounded-full" style={{width:fmtPct(d.value,processed.summary.totalFisico),backgroundColor:PIE_FISICO[d.name]}}/></div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="w-[120px] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart><Pie data={processed.fisicoPie} innerRadius="48%" outerRadius="82%" dataKey="value" strokeWidth={3} stroke="hsl(var(--background))" labelLine={false} label={PieLabel}>{processed.fisicoPie.map(e=><Cell key={e.name} fill={PIE_FISICO[e.name]}/>)}</Pie><Tooltip/></PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </section>

            {/* ── Tabela ── */}
            <section>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <TableIcon className="h-3.5 w-3.5"/>
                  Detalhamento · {tableRows.length} de {processed.tableData.length} registros
                  {tableRows.length!==processed.tableData.length&&<Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50">Filtrado</Badge>}
                </p>
                <div className="flex items-center gap-2">
                  {hasActiveFilters&&(
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3"/>Limpar filtros
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={()=>setShowFilters(v=>!v)} className={`h-7 text-xs gap-1.5 ${showFilters?'bg-primary text-primary-foreground border-primary hover:bg-primary/90':''}`}>
                    <SlidersHorizontal className="h-3.5 w-3.5"/>Filtros
                    {hasActiveFilters&&<span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"/>}
                  </Button>
                </div>
              </div>

              {/* Barra de filtros */}
              {showFilters&&(
                <Card className="border-none shadow-sm mb-3">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Busca texto */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
                        <Input
                          placeholder="Buscar tipo, natureza, plano ou subplano…"
                          value={searchText}
                          onChange={e=>setSearchText(e.target.value)}
                          className="pl-8 h-8 text-xs"
                        />
                        {searchText&&<button onClick={()=>setSearchText("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"/></button>}
                      </div>

                      {/* Filtro Financeiro */}
                      <Select value={filterCapex} onValueChange={setFilterCapex}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Status Financeiro"/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os status financeiros</SelectItem>
                          <SelectItem value="FINALIZADO">✅ Finalizado</SelectItem>
                          <SelectItem value="PARCIAL">⚠️ Parcial</SelectItem>
                          <SelectItem value="PENDENTE">⏳ Pendente</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Filtro Físico */}
                      <Select value={filterFisico} onValueChange={setFilterFisico}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Status Físico"/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os status físicos</SelectItem>
                          <SelectItem value="SIM">✅ Sim (Entregue)</SelectItem>
                          <SelectItem value="NAO">❌ Não</SelectItem>
                          <SelectItem value="PENDENTE">⏳ Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-none shadow-sm">
                <CardContent className="p-0">
                  <div className="max-h-[480px] overflow-auto rounded-xl">
                    <Table>
                      <TableHeader className="sticky top-0 z-10">
                        <TableRow className="bg-muted/80 hover:bg-muted/80">
                          <SortableHead col="tipo"              label="Tipo"        currentSort={sort} onSort={handleSort} className="pl-5 w-[80px]"/>
                          <SortableHead col="natureza"          label="Natureza"    currentSort={sort} onSort={handleSort} className="w-[130px]"/>
                          <SortableHead col="plano_text"        label="Plano"       currentSort={sort} onSort={handleSort}/>
                          <SortableHead col="plano_investimento"label="Subplano"    currentSort={sort} onSort={handleSort}/>
                          <SortableHead col="meta"              label="Meta (R$)"   currentSort={sort} onSort={handleSort} className="text-right w-[120px]"/>
                          <SortableHead col="peso"              label="Peso"        currentSort={sort} onSort={handleSort} className="text-center w-[110px]"/>
                          <SortableHead col="status_capex"      label="Financeiro"  currentSort={sort} onSort={handleSort} className="text-center w-[110px]"/>
                          <SortableHead col="status_fisico"     label="Físico"      currentSort={sort} onSort={handleSort} className="text-center w-[90px] pr-5"/>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableRows.length===0?(
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Search className="h-8 w-8 text-muted-foreground/30"/>
                                <span className="text-sm">Nenhum registro encontrado</span>
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs mt-1">Limpar filtros</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ):tableRows.map((item,idx)=>{
                          const pesoColor=item.peso>=10?"text-primary font-bold":item.peso>=5?"text-amber-600 font-semibold":"text-muted-foreground"
                          return (
                            <TableRow key={item.id??idx} className={`text-xs hover:bg-muted/40 transition-colors ${idx%2===1?'bg-muted/20':''}`}>
                              <TableCell className="pl-5 font-medium text-muted-foreground whitespace-nowrap">{item.tipo}</TableCell>
                              <TableCell className="text-muted-foreground">{item.natureza}</TableCell>
                              <TableCell className="font-medium max-w-[180px] truncate" title={item.plano_text}>{item.plano_text}</TableCell>
                              <TableCell className="max-w-[200px] truncate text-muted-foreground" title={item.plano_investimento}>{item.plano_investimento}</TableCell>
                              <TableCell className="text-right font-mono font-medium tabular-nums">{fmtBRL(item.meta)}</TableCell>

                              {/* Coluna PESO */}
                              <TableCell className="text-center px-3">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`tabular-nums text-xs ${pesoColor}`}>{item.peso.toFixed(1)}%</span>
                                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden max-w-[70px]">
                                    <div
                                      className="h-full rounded-full bg-primary/60 transition-all"
                                      style={{width:`${Math.min(item.peso * 3, 100)}%`}}
                                    />
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="text-center"><StatusBadge status={item.status_capex}/></TableCell>
                              <TableCell className="text-center pr-5">
                                {item.status_capex==='FINALIZADO'
                                  ?<StatusBadge status={item.status_fisico}/>
                                  :<span className="text-muted-foreground/40">—</span>}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Rodapé da tabela */}
              {tableRows.length>0&&(
                <div className="flex items-center justify-between mt-2 px-1">
                  <p className="text-xs text-muted-foreground">
                    Soma das metas filtradas: <span className="font-semibold text-foreground">{fmtBRL(tableRows.reduce((s,r)=>s+r.meta,0))}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Peso total filtrado: <span className="font-semibold text-foreground">{tableRows.reduce((s,r)=>s+r.peso,0).toFixed(1)}%</span>
                  </p>
                </div>
              )}
            </section>

          </>
        )}
      </main>
    </div>
  )
}
