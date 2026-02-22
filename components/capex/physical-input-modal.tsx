// components/capex/physical-input-modal.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

interface PhysicalItem {
  id?: number;
  name: string;
  value: number;
}

// >>> CORRIGIDO: A interface de props não espera mais 'month' nem 'onSave'
interface PhysicalInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  capexItem: { capex: string; label: string };
  targetTotal: number;
}

const formatNumber = (num: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(num);

export function PhysicalInputModal({ isOpen, onClose, capexItem, targetTotal }: PhysicalInputModalProps) {
  const [items, setItems] = useState<PhysicalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // >>> CORRIGIDO: A API não busca mais por mês
      fetch(`/api/physical-inputs?capex=${capexItem.capex}`)
        .then(res => res.ok ? res.json() : Promise.reject("Falha ao buscar dados."))
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
  // >>> CORRIGIDO: A dependência 'month.index' foi removida, consertando o erro.
  }, [isOpen, capexItem.capex]);

  const total = useMemo(() => items.reduce((sum, item) => sum + (Number(item.value) || 0), 0), [items]);
  
  const isTotalValid = total === targetTotal;

  const handleAddItem = () => {
    setItems([...items, { name: '', value: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'name' | 'value', fieldValue: string) => {
    const newItems = [...items];
    if (field === 'name') newItems[index].name = fieldValue;
    else newItems[index].value = Number(fieldValue) || 0;
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!isTotalValid) {
      alert("O total dos físicos deve ser exatamente igual ao valor financeiro alvo.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch('/api/physical-inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capex: capexItem.capex,
          items: items.filter(item => item.name.trim() && item.value > 0),
        }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).error || "Falha ao salvar.");
      }
      
      onClose(); // Apenas fecha o modal em caso de sucesso
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
            <h3 className="text-lg font-semibold text-slate-800">Detalhamento Físico</h3>
            <p className="text-sm text-slate-600">{capexItem.label}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800"><X size={20} /></button>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? ( <p>Carregando...</p> ) : (
            <table className="w-full border-collapse">
              <thead><tr className="bg-slate-50"><th className="p-2 text-left text-sm font-medium text-slate-600 border-b">Nome do Físico</th><th className="p-2 text-left text-sm font-medium text-slate-600 border-b w-40">Valor (R$ Mil)</th><th className="p-2 text-center text-sm font-medium text-slate-600 border-b w-12">Ação</th></tr></thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50"><td className="p-1 border-b"><input type="text" value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" placeholder="Ex: Transformador 500kVA"/></td><td className="p-1 border-b"><input type="number" value={item.value === 0 ? '' : item.value} onChange={(e) => handleItemChange(index, 'value', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right" placeholder="0"/></td><td className="p-1 border-b text-center"><button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"><Trash2 size={16} /></button></td></tr>
                ))}
                 {items.length === 0 && !isLoading && (<tr><td colSpan={3} className="text-center text-sm text-slate-500 py-8 border-b">Nenhum físico adicionado.</td></tr>)}
              </tbody>
            </table>
          )}
          <button onClick={handleAddItem} className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium" disabled={isLoading}><Plus size={16} />Adicionar Item</button>
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-slate-50 rounded-b-lg">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total dos Físicos:</span>
              <span className="font-bold text-slate-800 text-base">R$ {formatNumber(total)}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-slate-600">Valor Alvo (Financeiro):</span>
              <span className="font-bold text-slate-800 text-base">R$ {formatNumber(targetTotal)}</span>
            </div>
            <div className="mt-3 pt-3 border-t">
              {isTotalValid ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle size={16}/>
                  <span className="font-semibold">Os totais correspondem. Você pode salvar.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <AlertTriangle size={16}/>
                  <span className="font-semibold">Os totais devem ser idênticos para salvar.</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 ml-6">
            <button onClick={onClose} className="text-sm bg-white border border-slate-300 rounded px-4 py-2 hover:bg-slate-100 font-semibold text-slate-700">Cancelar</button>
            <button onClick={handleSave} disabled={isSaving || isLoading || !isTotalValid} className="text-sm bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed font-semibold">{isSaving ? "Salvando..." : "Salvar Físicos"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
