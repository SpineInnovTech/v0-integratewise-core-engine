"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AccountRisk {
  id: string
  name: string
  athr_percentage: number
  renewal_risk: string
  technical_score: number
  adoption_score: number
}

export default function RisksPage() {
  const [risks, setRisks] = useState<AccountRisk[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchRisks()
  }, [])

  async function fetchRisks() {
    const { data, error } = await supabase
      .from("tam_accounts")
      .select("*")
      .or("renewal_risk.eq.High,renewal_risk.eq.Critical")
      .order("athr_percentage", { ascending: false })

    if (!error && data) {
      setRisks(data)
    }
    setLoading(false)
  }

  const getRiskColor = (risk: string) => {
    if (risk === "Critical") return "border-l-4 border-red-500 bg-red-50"
    if (risk === "High") return "border-l-4 border-orange-500 bg-orange-50"
    return "border-l-4 border-yellow-500 bg-yellow-50"
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-8 w-8" />
          Account Risks
        </h1>
        <p className="text-foreground/60 mt-2">High-risk accounts requiring immediate attention</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">Loading risks...</CardContent>
          </Card>
        ) : risks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">No high-risk accounts</CardContent>
          </Card>
        ) : (
          risks.map((risk) => (
            <Card key={risk.id} className={getRiskColor(risk.renewal_risk)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{risk.name}</h3>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-red-200 text-red-900">
                    {risk.renewal_risk}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-foreground/60">ATHR</p>
                    <p className="font-bold text-lg">{risk.athr_percentage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Technical Score</p>
                    <p className="font-bold text-lg">{risk.technical_score}/100</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Adoption</p>
                    <p className="font-bold text-lg">{risk.adoption_score}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
