// components/capex/physical-input-modal.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Trash2, Plus } from 'lucide-react';

interface Item {
  id?: number | string;
  name: string;
  value: number;
}

interface PhysicalInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  capexItem: { capex: string; label: string; };
  targetTotal: number;
}

const formatNumber = (num: number) => new Intl.NumberFormat("pt-BR", { style: 'currency', currency: 'BRL' }).format(num);

export function PhysicalInputModal({ isOpen, onClose, onSaveSuccess, capexItem, targetTotal }: PhysicalInputModalProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchInputs = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/capex/physical-inputs?capex=${encodeURIComponent(capexItem.capex)}`);
        if (!res.ok) throw new Error('Falha ao buscar dados');
        const data = await res.json();
        setItems(data.map((d: any) => ({ ...d, id: d.id || `temp_${Math.random()}` })));
      } catch (error) {
        console.error(error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInputs();
  }, [isOpen, capexItem.capex]);

  const totalDosFisicos = useMemo(() => items.reduce((sum, item) => sum + (Number(item.value) || 0), 0), [items]);
  const totalsMatch = useMemo(() => Math.abs(totalDosFisicos - targetTotal) < 0.01, [totalDosFisicos, targetTotal]);

  const handleItemChange = (index: number, field: 'name' | 'value', fieldValue: string) => {
    const newItems = [...items];
    if (field === 'value') {
      newItems[index][field] = parseFloat(fieldValue) || 0;
    } else {
      newItems[index][field] = fieldValue;
    }
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { id: `temp_${Date.now()}`, name: '', value: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!totalsMatch) {
      alert("Os totais devem ser idênticos para salvar.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/capex/physical-inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capex: capexItem.capex,
          inputs: items.map(({ name, value }) => ({ name, value })),
          targetTotal: targetTotal,
        }),
      });

      if (!res.ok) throw new Error('Falha ao salvar os dados.');
      
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white w-full max-w-2xl rounded-lg border shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95">
        <div className="flex items-start justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Detalhamento Físico</h3>
            <p className="text-sm text-slate-500">{capexItem.label}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-[1fr_150px_auto] gap-x-4 items-center mb-2 px-2">
            <label className="text-xs font-medium text-slate-500">Nome do Físico</label>
            <label className="text-xs font-medium text-slate-500">Valor (R$)</label>
            <label className="text-xs font-medium text-slate-500">Ação</label>
          </div>
          {isLoading ? (
            <p className="text-sm text-slate-500 text-center py-4">Carregando...</p>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-[1fr_150px_auto] gap-x-4 items-center">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    placeholder="Ex: Transformador"
                  />
                  <input
                    type="number"
                    value={item.value || ''}
                    onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm text-right"
                    placeholder="0"
                  />
                  <button onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button onClick={handleAddItem} className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800">
            <Plus size={16} /> Adicionar Item
          </button>
        </div>

        <div className="p-6 border-t bg-slate-50 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Total dos Físicos:</span>
            <span className="font-semibold text-slate-800">{formatNumber(totalDosFisicos)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Valor Alvo (Financeiro):</span>
            <span className="font-semibold text-slate-800">{formatNumber(targetTotal)}</span>
          </div>
          
          {!totalsMatch && items.length > 0 && (
             <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100 p-2 rounded-md border border-amber-200">
                <p><strong>Atenção:</strong> Os totais devem ser idênticos para salvar.</p>
             </div>
          )}
        </div>

        <div className="flex items-center justify-end p-4 border-t gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border rounded-md hover:bg-slate-50">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={!totalsMatch || isSaving}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isSaving ? "Salvando..." : "Salvar Físicos"}
          </button>
        </div>
      </div>
    </div>
  );
}
