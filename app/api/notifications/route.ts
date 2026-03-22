// app/api/notifications/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Substitua depois por query real no banco
  return NextResponse.json([
    {
      id: "1",
      title: "Nova solicitação",
      message: "Pedro solicitou aprovação no subplano BA-01",
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Permissão aprovada",
      message: "Sua solicitação de edição foi aprovada",
      read: true,
      createdAt: new Date().toISOString(),
    },
  ]);
}
