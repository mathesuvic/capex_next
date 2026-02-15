// app/permissions/permission-requests-form.tsx

"use client";

import { useEffect, useMemo, useState, useRef } from "react";

type CapexRow = { id: string; label: string };

export default function PermissionRequestForm() {
  const [capex, setCapex] = useState<CapexRow[]>([]);
  const [selectedCapex, setSelectedCapex] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectorRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    fetch("/api/capex?purpose=dropdown")
      .then((r) => r.json())
      .then((data) => {
        const rows = (data ?? []).map((x: any) => ({ id: x.id, label: x.label }));
        setCapex(rows);
      })
      .catch(() => setCapex([]));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsSelectorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectorRef]);

  const availableOptions = useMemo(() => {
    return capex
      .filter(option => !selectedCapex.includes(option.label))
      .filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [capex, selectedCapex, searchTerm]);

  function handleSelectOption(label: string) {
    setSelectedCapex(prev => [...prev, label]);
    setSearchTerm(""); 
    setIsSelectorOpen(true); 
  }

  function handleDeselectOption(label: string) {
    setSelectedCapex(prev => prev.filter(item => item !== label));
  }

  async function submit() {
    setStatus(null);
    if (selectedCapex.length === 0) {
      setStatus("Selecione ao menos um plano/linha para solicitar.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/permissions/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capexLabels: selectedCapex, reason }),
        // --- CORREÇÃO AQUI ---
        // Força o navegador a incluir os cookies (como o de autenticação) na requisição.
        credentials: 'include',
      });

      // A partir daqui, vamos melhorar a mensagem de erro que aparece na tela
      const json = await res.json();
      if (!res.ok) {
        // Se a API retornar um erro "unauthorized", mostra uma mensagem mais amigável
        if (res.status === 401) {
          setStatus("Sua sessão expirou. Por favor, faça login novamente.");
        } else {
          setStatus(json?.error ?? "Erro ao enviar solicitação.");
        }
      } else {
        setStatus("Solicitações enviadas com sucesso!");
        setReason("");
        setSelectedCapex([]);
      }
    } catch (e) {
      console.error(e);
      setStatus("Ocorreu um erro de rede ao tentar enviar a solicitação.");
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      
      <div className="rounded-lg border border-slate-200 p-4 md:col-span-2">
        <label className="block text-sm font-medium text-slate-700">Planos/Linhas</label>
        
        <div className="relative mt-2" ref={selectorRef}>
          <div 
            onClick={() => setIsSelectorOpen(true)}
            className="flex min-h-[42px] flex-wrap items-center gap-2 rounded-md border border-slate-300 p-2"
          >
            {selectedCapex.map(label => (
              <span key={label} className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-sm text-green-800">
                {label}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeselectOption(label); }}
                  className="rounded-full text-green-600 hover:bg-green-200"
                >
                  &#x2715; 
                </button>
              </span>
            ))}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSelectorOpen(true)}
              placeholder={selectedCapex.length === 0 ? "Comece a digitar para filtrar..." : ""}
              className="flex-grow border-none bg-transparent p-0 text-sm focus:ring-0"
            />
          </div>
          {isSelectorOpen && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
              {availableOptions.map(option => (
                <div
                  key={option.id}
                  onClick={() => handleSelectOption(option.label)}
                  className="cursor-pointer px-4 py-2 text-sm text-slate-800 hover:bg-slate-100"
                >
                  {option.label}
                </div>
              ))}
              {availableOptions.length === 0 && <div className="px-4 py-2 text-sm text-slate-500">Nenhum resultado encontrado.</div>}
            </div>
          )}
        </div>

        <label className="mt-4 block text-sm font-medium text-slate-700">Motivo (opcional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
          rows={3}
          placeholder="Ex: preciso atualizar os valores por conta do novo orçamento."
        />

        <button
          onClick={submit}
          disabled={loading || selectedCapex.length === 0}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-green-700 px-4 py-2 text-white hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? "Enviando..." : `Enviar ${selectedCapex.length} Solicitaç${selectedCapex.length > 1 ? 'ões' : 'ão'}`}
        </button>

        {status && <p className="mt-3 text-sm text-slate-700">{status}</p>}
      </div>

      <div className="md:col-span-1">
        {selectedCapex.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-green-900">
                {selectedCapex.length} Plano(s) Selecionado(s)
              </h3>
              <button
                onClick={() => setSelectedCapex([])}
                className="text-xs font-semibold text-green-700 underline hover:text-green-900"
              >
                Limpar Tudo
              </button>
            </div>
            <ul className="max-h-[480px] space-y-2 overflow-y-auto">
              {selectedCapex.map(label => (
                <li key={label} className="text-sm text-slate-700">
                  - {label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

    </div>
  );
}
