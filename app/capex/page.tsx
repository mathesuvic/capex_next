import { CapexTable } from "@/components/capex-table"

export default function CapexPage() {
  return (
    <main className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-[#00823B] mb-6">CAPEX 2025</h1>
        <CapexTable />
      </div>
    </main>
  )
}
