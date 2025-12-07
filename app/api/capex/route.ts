import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const capexData = await db.subplan.findMany(); // Trocamos "capex" por "subplan"
    return NextResponse.json(capexData);
  } catch (error) {
    console.error('[API_CAPEX_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
