// app/permissions/permission-reqyests-form.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type CapexRow = { id: string; label: string };

export default function PermissionRequestForm() {
  const [capex, setCapex] = useState<CapexRow[]>([]);
  const [capexLabel, setCapexLabel] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reaproveita seu GET /api/capex para listar labels
    fetch("/api/capex")
      .then((r) => r.json())
      .then((data) => {
        const rows = (data ?? []).map((x: any) => ({ id: x.id, label: x.label }));
        setCapex(rows);
      })
      .catch(() => setCapex([]));
  }, []);

  const options = useMemo(() => capex.filter(Boolean), [capex]);

  async function submit() {
    setStatus(null);
    if (!capexLabel) {
      setStatus("Selecione um plano/linha para solicitar.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/permissions/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capexLabel, reason }),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatus(json?.error ?? "Erro ao enviar solicitação.");
      } else {
        setStatus(json?.alreadyPending ? "Já existe uma solicitação pendente para este item." : "Solicitação enviada!");
        setReason("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <label className="block text-sm font-medium text-slate-700">Plano/Linha</label>
      <select
        value={capexLabel}
        onChange={(e) => setCapexLabel(e.target.value)}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
      >
        <option value="">Selecione…</option>
        {options.map((r) => (
          <option key={r.id} value={r.label}>
            {r.label}
          </option>
        ))}
      </select>

      <label className="mt-4 block text-sm font-medium text-slate-700">Motivo (opcional)</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
        rows={3}
        placeholder="Ex: preciso atualizar os valores do plano 1.2 por conta do orçamento."
      />

      <button
        onClick={submit}
        disabled={loading}
        className="mt-4 inline-flex items-center justify-center rounded-md bg-green-700 px-4 py-2 text-white hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Enviar solicitação"}
      </button>

      {status && <p className="mt-3 text-sm text-slate-700">{status}</p>}
    </div>
  );
}
