// components/capex/physical-input-modal.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface PhysicalItem {
  id?: number;
  name: string;
  value: number;
}

interface PhysicalInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (monthIndex: number, newTotalValue: number) => void;
  capexItem: { capex: string; label: string };
  month: { index: number; name: string };
}

const formatNumber = (num: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(num);

export function PhysicalInputModal({ isOpen, onClose, onSave, capexItem, month }: PhysicalInputModalProps) {
  const [items, setItems] = useState<PhysicalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch(`/api/physical-inputs?capex=${capexItem.capex}&month=${month.index + 1}`)
        .then(res => {
          if (!res.ok) throw new Error("Falha ao buscar dados.");
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setItems(data.map(item => ({...item, value: Number(item.value)})));
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setItems([]); 
    }
  }, [isOpen, capexItem.capex, month.index]);

  const total = useMemo(() => items.reduce((sum, item) => sum + (Number(item.value) || 0), 0), [items]);

  const handleAddItem = () => {
    setItems([...items, { name: '', value: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'name' | 'value', fieldValue: string) => {
    const newItems = [...items];
    if (field === 'name') {
      newItems[index].name = fieldValue;
    } else {
      newItems[index].value = Number(fieldValue) || 0;
    }
    setItems(newItems);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/physical-inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capex: capexItem.capex,
          month: month.index + 1,
          items: items.filter(item => item.name.trim() && item.value > 0),
          totalValue: total,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao salvar.");
      }
      
      onSave(month.index, total);
      onClose();
    } catch (error) {
      alert(`Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-2xl border border-slate-300">
        <div className="flex items-start justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Inputs Físicos - {month.name.toUpperCase()}/25</h3>
            <p className="text-sm text-slate-600">{capexItem.label}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800"><X size={20} /></button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (<p className="text-sm text-slate-500 text-center">Carregando...</p>) : (
            <>
              <table className="w-full border-collapse">
                <thead><tr className="bg-slate-50"><th className="p-2 text-left text-sm font-medium text-slate-600 border-b">Nome do Físico</th><th className="p-2 text-left text-sm font-medium text-slate-600 border-b w-40">Valor (R$ Mil)</th><th className="p-2 text-center text-sm font-medium text-slate-600 border-b w-12">Ação</th></tr></thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50"><td className="p-1 border-b"><input type="text" value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Transformador 500kVA"/></td><td className="p-1 border-b"><input type="number" value={item.value === 0 ? '' : item.value} onChange={(e) => handleItemChange(index, 'value', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0"/></td><td className="p-1 border-b text-center"><button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50" title="Remover Item"><Trash2 size={16} /></button></td></tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={3} className="text-center text-sm text-slate-500 py-8 border-b">Nenhum físico adicionado.</td></tr>}
                </tbody>
              </table>
              <button onClick={handleAddItem} className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50" disabled={isLoading}><Plus size={16} />Adicionar Item</button>
            </>
          )}
        </div>
        <div className="flex items-center justify-between p-4 border-t bg-slate-50 rounded-b-lg">
          <div><span className="text-slate-600">Total: </span><span className="font-bold text-slate-800 text-base">R$ {formatNumber(total)}</span><p className="text-xs text-slate-500 mt-1">Este valor substituirá o valor financeiro do mês.</p></div>
          <div className="flex gap-3"><button onClick={onClose} className="text-sm bg-white border border-slate-300 rounded px-4 py-2 hover:bg-slate-100 font-semibold text-slate-700">Cancelar</button><button onClick={handleSave} disabled={isSaving || isLoading} className="text-sm bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed font-semibold">{isSaving ? "Salvando..." : "Salvar e Atualizar"}</button></div>
        </div>
      </div>
    </div>
  );
}
