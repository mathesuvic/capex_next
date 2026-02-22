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

// Tipos e constantes para corresponder ao backend
type Risco = 'BAIXO' | 'MEDIO' | 'ALTO';
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

interface PhysicalItem {
  id: number | string; // Usamos string para itens novos, não salvos
  name: string;
  risco: Risco;
  [key: string]: any; // Permite campos dinâmicos para os meses (jan, fev, etc.)
}

interface PhysicalInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Renomeado de onSaveSuccess para clareza
  capexLabel: string | null;
  financialValue: number; // Renomeado de targetTotal
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function PhysicalInputModal({
  isOpen,
  onClose,
  onSave,
  capexLabel,
  financialValue,
}: PhysicalInputModalProps) {
  const [items, setItems] = useState<PhysicalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efeito para buscar os dados quando o modal abre
  useEffect(() => {
    if (isOpen && capexLabel) {
      setIsLoading(true);
      // Usamos encodeURIComponent para garantir que caracteres especiais no label não quebrem a URL
      fetch(`/api/capex/physical-inputs?capexLabel=${encodeURIComponent(capexLabel)}`)
        .then((res) => {
            if (!res.ok) throw new Error('Falha ao buscar dados');
            return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            // Converte o ID para string para consistência no estado
            setItems(data.map(d => ({ ...d, id: d.id.toString() })));
          }
        })
        .catch(() => toast.error('Erro ao carregar os dados físicos existentes.'))
        .finally(() => setIsLoading(false));
    } else {
      // Limpa o estado quando o modal é fechado para não mostrar dados antigos
      setItems([]);
    }
  }, [isOpen, capexLabel]);

  // Calcula o total dos físicos somando todos os meses de todos os itens
  const totalPhysicalValue = useMemo(() => {
    return items.reduce((total, item) => {
      const itemTotal = MONTHS.reduce((itemSum, month) => itemSum + Number(item[month] || 0), 0);
      return total + itemTotal;
    }, 0);
  }, [items]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `new-${Date.now()}`, // ID temporário para novos itens
        name: '',
        risco: 'BAIXO',
        ...MONTHS.reduce((acc, month) => ({ ...acc, [month]: 0 }), {}), // Inicializa todos os meses com 0
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

    // Validação simples para garantir que todos os itens tenham nome
    if (items.some(item => !item.name.trim())) {
      toast.error("Todos os itens devem ter um nome.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/capex/physical-inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Envia o corpo no formato que a nova API espera
        body: JSON.stringify({ capexLabel, items }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar os dados. Verifique o console do servidor.');
      }

      toast.success('Detalhamento físico salvo com sucesso!');
      onSave(); // Notifica o componente pai para recarregar os dados
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
        onSave();
        onClose();

    } catch (error) {
        toast.error((error as Error).message);
    } finally {
        setIsUploading(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = ""; // Reseta o input para permitir re-upload do mesmo arquivo
        }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Detalhamento Físico - {capexLabel}</DialogTitle>
        </DialogHeader>

        {/* Corpo rolável do modal */}
        <div className="flex-grow overflow-y-auto pr-4">
          <div className="flex justify-between items-center mb-4">
             <Button variant="outline" size="sm" onClick={handleAddItem}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
            <div className='flex items-center gap-2'>
              <a href="/templates/template-fisicos.xlsx" download>
                  <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" /> Baixar Template
                  </Button>
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
              <TableHeader className="sticky top-0 bg-slate-50 z-10">
                <TableRow>
                  <TableHead className="min-w-[250px]">Nome do Físico</TableHead>
                  <TableHead className="min-w-[150px]">Risco Realização</TableHead>
                  {MONTHS.map(m => <TableHead key={m} className="min-w-[120px] capitalize text-right">{m}</TableHead>)}
                  <TableHead className="w-[50px] text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={15} className='h-24 text-center'><Loader2 className='mx-auto animate-spin text-slate-500'/></TableCell></TableRow>
                ) : items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                       <Select
                          value={item.risco}
                          onValueChange={(value: Risco) => handleItemChange(item.id, 'risco', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BAIXO">Baixo</SelectItem>
                            <SelectItem value="MEDIO">Médio</SelectItem>
                            <SelectItem value="ALTO">Alto</SelectItem>
                          </SelectContent>
                        </Select>
                    </TableCell>
                    {MONTHS.map(m => (
                       <TableCell key={m}>
                         <Input
                           type="number"
                           value={item[m] || 0}
                           onChange={(e) => handleItemChange(item.id, m, parseFloat(e.target.value) || 0)}
                           className="h-8 text-right"
                         />
                       </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Rodapé fixo */}
        <DialogFooter className="mt-4 pt-4 border-t flex-shrink-0">
          <div className="w-full flex justify-between items-center">
             <div className="text-sm space-y-1">
                <p>Total dos Físicos: <span className="font-bold text-slate-800">{formatCurrency(totalPhysicalValue)}</span></p>
                <p>Valor Alvo (Financeiro): <span className="font-bold text-slate-800">{formatCurrency(financialValue)}</span></p>
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
