//app/admin/permissions/requests.tsx
"use client";

import { useEffect, useState } from "react";

type ReqItem = {
  id: string;
  capexLabel: string;
  reason: string | null;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  };
};

export default function AdminPermissionRequests() {
  const [items, setItems] = useState<ReqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/permissions/requests", {
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setMsg(errorData.details || "Sem acesso ou erro ao carregar.");
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(data);
    } catch (err) {
      setMsg("Falha ao conectar com a API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: "approve" | "reject") {
    setProcessingId(id);
    setMsg(null);

    try {
      const apiStatus = action === "approve" ? "APPROVED" : "REJECTED";

      const res = await fetch(`/api/admin/permissions/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: apiStatus }),
        credentials: "include",
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const error = new Error(j?.details ?? "Erro ao atualizar solicitação.");
        throw error;
      }
      
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setProcessingId(null);
    }
  }
  
  if (loading) return <p>Carregando solicitações pendentes...</p>;

  if (msg) return <p className="text-red-500">{msg}</p>;
  
  if (items.length === 0) return <p>Nenhuma solicitação pendente no momento.</p>;

  return (
    <div className="space-y-4">
      {items.map((r) => (
        <div key={r.id} className="border rounded-lg p-4 shadow-sm bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{r.user?.email || "Usuário desconhecido"}</p>
              <p className="text-sm text-gray-700">
                Solicitou: <span className="font-semibold">{r.capexLabel}</span>
              </p>
              {r.reason && (
                <p className="text-sm text-gray-500 mt-1">
                  Motivo: {r.reason}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => act(r.id, "approve")}
                disabled={!!processingId}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {processingId === r.id ? "Processando..." : "Aprovar"}
              </button>
              <button
                onClick={() => act(r.id, "reject")}
                disabled={!!processingId}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                {processingId === r.id ? "Processando..." : "Rejeitar"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
