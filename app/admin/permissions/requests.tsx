// app/admin/permissions/requests.tsx
"use client";

import { useEffect, useState } from "react";

type ReqItem = {
  id: string;
  capexLabel: string;
  reason: string | null;
  createdAt: string;
  user: { email: string; name: string | null };
};

export default function AdminPermissionRequests() {
  const [items, setItems] = useState<ReqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/permissions/requests");
      if (!res.ok) {
        setMsg("Sem acesso ou erro ao carregar.");
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: "approve" | "reject") {
    setMsg(null);
    const res = await fetch(`/api/admin/permissions/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg(j?.error ?? "Erro ao atualizar solicitação.");
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  if (loading) return <p>Carregando…</p>;

  return (
    <div className="space-y-3">
      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      {items.length === 0 ? (
        <p className="text-slate-600">Nenhuma solicitação pendente.</p>
      ) : (
        items.map((r) => (
          <div key={r.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{r.user_permissionrequest_userIdTouser.email}</p>
                <p className="text-sm text-slate-600">Solicitou: {r.capexLabel}</p>
                {r.reason && <p className="mt-2 text-sm text-slate-700">Motivo: {r.reason}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => act(r.id, "approve")}
                  className="rounded-md bg-green-700 px-3 py-2 text-white hover:bg-green-800"
                >
                  Aprovar
                </button>
                <button
                  onClick={() => act(r.id, "reject")}
                  className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                >
                  Rejeitar
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
