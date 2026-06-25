"use client"

import { useEffect, useState } from "react"
import { ShieldAlert } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface TAMAccount {
  id: string
  name: string
  segment: string
  rag_status: string
  technical_score: number
  adoption_score: number
  arr: number
  renewal_risk: string
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<TAMAccount[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    const { data, error } = await supabase.from("tam_accounts").select("*").order("arr", { ascending: false })

    if (!error && data) {
      setAccounts(data)
    }
    setLoading(false)
  }

  const ragStatusColors = {
    Green: "bg-green-100 text-green-900",
    Amber: "bg-yellow-100 text-yellow-900",
    Red: "bg-red-100 text-red-900",
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-8 w-8" />
          TAM Accounts
        </h1>
        <p className="text-foreground/60 mt-2">Monitor health and engagement for all accounts</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold">Account Name</th>
              <th className="text-left py-3 px-4 font-semibold">Segment</th>
              <th className="text-left py-3 px-4 font-semibold">Status</th>
              <th className="text-left py-3 px-4 font-semibold">Technical</th>
              <th className="text-left py-3 px-4 font-semibold">Adoption</th>
              <th className="text-left py-3 px-4 font-semibold">ARR</th>
              <th className="text-left py-3 px-4 font-semibold">Renewal Risk</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-foreground/60">
                  Loading accounts...
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-foreground/60">
                  No accounts yet
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 font-medium">{account.name}</td>
                  <td className="py-3 px-4 text-foreground/60">{account.segment}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${ragStatusColors[account.rag_status as keyof typeof ragStatusColors] || ""}`}
                    >
                      {account.rag_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{account.technical_score}/100</td>
                  <td className="py-3 px-4">{account.adoption_score}%</td>
                  <td className="py-3 px-4">${(account.arr || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-xs">{account.renewal_risk}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
