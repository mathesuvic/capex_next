// components/capex/physical-input-modal.tsx

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Trash2, PlusCircle, Upload, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Importe o utilitário para classes condicionais

// Tipos e constantes para corresponder ao backend
type Risco = 'BAIXO' | 'MEDIO' | 'ALTO';

interface PhysicalItem {
  id: number | string; // Usamos string para itens novos, não salvos
  name: string;
  risco: Risco;
  [key: string]: any; // Permite campos dinâmicos para os meses (jan, fev, etc.)
}

// =================================================================
// Props ATUALIZADAS para receber os meses editáveis e os dados financeiros
// =================================================================
interface PhysicalInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  capexLabel: string | null;
  editableMonths: string[]; // Ex: ['jul', 'ago', 'set']
  financialData: Record<string, number>; // Ex: { jul: 50000, ago: 90000, set: 78588 }
}
// =================================================================

const formatCurrency = (value: number) => {
  // Adicionado `|| 0` para evitar erros com valores nulos ou indefinidos
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

export function PhysicalInputModal({
  isOpen,
  onClose,
  onSave,
  capexLabel,
  editableMonths, // Nova prop
  financialData, // Nova prop
}: PhysicalInputModalProps) {
  const [items, setItems] = useState<PhysicalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && capexLabel) {
      setIsLoading(true);
      fetch(`/api/capex/physical-inputs?capexLabel=${encodeURIComponent(capexLabel)}`)
        .then((res) => res.ok ? res.json() : Promise.reject('Falha ao buscar dados'))
        .then((data: PhysicalItem[]) => {
          setItems(data.map(d => ({ ...d, id: d.id.toString() })));
        })
        .catch(() => toast.error('Erro ao carregar os dados físicos existentes.'))
        .finally(() => setIsLoading(false));
    } else {
      setItems([]); // Limpa o estado ao fechar
    }
  }, [isOpen, capexLabel]);

  // Calcula o total para CADA MÊS editável
  const monthlyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const month of editableMonths) {
      totals[month] = items.reduce((sum, item) => sum + Number(item[month] || 0), 0);
    }
    return totals;
  }, [items, editableMonths]);

  // Calcula o total GERAL físico (soma de todos os meses editáveis)
  const totalPhysicalValue = useMemo(() => {
    return Object.values(monthlyTotals).reduce((sum, monthTotal) => sum + monthTotal, 0);
  }, [monthlyTotals]);
  
  // Calcula o total GERAL financeiro (soma de todos os meses editáveis)
  const totalFinancialValue = useMemo(() => {
     return Object.values(financialData).reduce((sum, monthValue) => sum + (monthValue || 0), 0);
  }, [financialData]);

  const handleAddItem = () => {
    // Inicializa APENAS os meses editáveis com 0
    const newMonthValues = editableMonths.reduce((acc, month) => ({ ...acc, [month]: 0 }), {});
    setItems([
      ...items,
      {
        id: `new-${Date.now()}`,
        name: '',
        risco: 'BAIXO',
        ...newMonthValues,
      },
    ]);
  };

  const handleRemoveItem = (id: number | string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: number | string, field: string, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };
  
  const handleSave = async () => {
    if (!capexLabel) return;
    setIsLoading(true);

    if (items.some(item => !item.name.trim())) {
      toast.error("Todos os itens devem ter um nome.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/capex/physical-inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capexLabel, items }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar os dados.');
      }

      toast.success('Detalhamento físico salvo com sucesso!');
      onSave();
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !capexLabel) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('capexLabel', capexLabel);

    try {
        const response = await fetch('/api/capex/physical-inputs/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha no upload do arquivo.');
        }

        const result = await response.json();
        toast.success(`${result.importedCount} itens importados com sucesso!`);
        onSave(); // Recarrega os dados na tela principal
        onClose(); // Fecha o modal

    } catch (error) {
        toast.error((error as Error).message);
    } finally {
        setIsUploading(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = ""; 
        }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Detalhamento Físico - {capexLabel}</DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-4">
          <div className="flex justify-between items-center mb-4">
             <Button variant="outline" size="sm" onClick={handleAddItem}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
            <div className='flex items-center gap-2'>
              <a href="/templates/template-fisicos.xlsx" download>
                  <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Baixar Template</Button>
              </a>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Importar Excel
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
            </div>
          </div>
          
          <div className="border rounded-md">
            <Table>
              {/* HEADER: Agora usa `editableMonths` para criar as colunas */}
              <TableHeader className="sticky top-0 bg-slate-50 z-10">
                <TableRow>
                  <TableHead className="min-w-[250px]">Nome do Físico</TableHead>
                  <TableHead className="min-w-[150px]">Risco Realização</TableHead>
                  {editableMonths.map(m => <TableHead key={m} className="min-w-[120px] capitalize text-right">{m}</TableHead>)}
                  <TableHead className="w-[50px] text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={editableMonths.length + 3} className='h-24 text-center'><Loader2 className='mx-auto animate-spin text-slate-500'/></TableCell></TableRow>
                ) : (
                  <>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} className="h-8"/>
                        </TableCell>
                        <TableCell>
                           <Select value={item.risco} onValueChange={(value: Risco) => handleItemChange(item.id, 'risco', value)}>
                              <SelectTrigger className="h-8"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BAIXO">Baixo</SelectItem>
                                <SelectItem value="MEDIO">Médio</SelectItem>
                                <SelectItem value="ALTO">Alto</SelectItem>
                              </SelectContent>
                            </Select>
                        </TableCell>
                        {/* Células de Input: Também usam `editableMonths` */}
                        {editableMonths.map(m => (
                           <TableCell key={m}>
                             <Input type="number" value={item[m] || 0} onChange={(e) => handleItemChange(item.id, m, parseFloat(e.target.value) || 0)} className="h-8 text-right"/>
                           </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* ================================================================ */}
                    {/* NOVAS LINHAS DE TOTAL E COMPARAÇÃO                              */}
                    {/* ================================================================ */}
                    <TableRow className="bg-slate-50 font-bold sticky bottom-0">
                        <TableCell colSpan={2} className="text-right">Total Físico</TableCell>
                        {editableMonths.map(month => {
                            const physicalTotal = monthlyTotals[month];
                            const financialTarget = financialData[month] || 0;
                            // Compara com tolerância para evitar problemas com ponto flutuante
                            const matches = Math.abs(physicalTotal - financialTarget) < 0.01;
                            return (
                                <TableCell key={month} className={cn(
                                    "text-right",
                                    !matches && "text-red-600 font-extrabold" // Destaque se não bater
                                )}>
                                    {formatCurrency(physicalTotal)}
                                </TableCell>
                            )
                        })}
                        <TableCell></TableCell>{/* Célula vazia para a coluna Ação */}
                    </TableRow>
                    <TableRow className="bg-slate-100 font-medium">
                        <TableCell colSpan={2} className="text-right">Meta (Financeiro)</TableCell>
                        {editableMonths.map(month => (
                            <TableCell key={month} className="text-right text-slate-700">
                                {formatCurrency(financialData[month] || 0)}
                            </TableCell>
                        ))}
                        <TableCell></TableCell>{/* Célula vazia para a coluna Ação */}
                    </TableRow>
                    {/* ================================================================ */}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <DialogFooter className="mt-4 pt-4 border-t flex-shrink-0">
          <div className="w-full flex justify-between items-center">
             <div className="text-sm space-y-1">
                {/* Rodapé agora mostra a soma apenas dos meses relevantes */}
                <p>Total dos Físicos: <span className="font-bold text-slate-800">{formatCurrency(totalPhysicalValue)}</span></p>
                <p>Valor Alvo (Financeiro): <span className="font-bold text-slate-800">{formatCurrency(totalFinancialValue)}</span></p>
             </div>
             <div>
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isLoading || isUploading}>
                    {isLoading || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Físicos'}
                </Button>
             </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
