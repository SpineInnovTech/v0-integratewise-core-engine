"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function CSAccountDetailView({ accountId }: { accountId: string }) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="bg-gradient-to-br from-primary via-primary to-primary/90 rounded-xl p-6 text-primary-foreground shadow-lg">
        <Link
          href="/cs/accounts"
          className="text-sm mb-4 inline-flex items-center gap-2 opacity-90 hover:opacity-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Accounts Hub
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-3 tracking-tight">Account {accountId}</h1>
            <div className="text-base opacity-90">
              Customer Segment · $240K ARR · Renewal: Jan 15, 2026 (75 days)
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="bg-background text-primary hover:bg-background/90">
              Schedule QBR
            </Button>
            <Button variant="outline" className="bg-transparent border-background text-background hover:bg-background/20">
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-amber-500/10 border-l-4 border-amber-500/80 rounded-xl p-6 flex justify-between items-center">
        <div className="flex-1">
          <div className="text-lg font-bold text-amber-900 mb-2">⚠️ Action Required: Q4 QBR Overdue</div>
          <div className="text-sm text-amber-800 leading-relaxed">
            Last QBR was 28 days ago. With renewal in 75 days, schedule immediately to discuss expansion opportunities.
          </div>
        </div>
        <Button className="bg-amber-500/90 text-white hover:bg-amber-500">Schedule Now</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-8">
          <Card className="bg-gradient-to-br from-card to-card/95 border-l-4 border-l-primary/80">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">
                    Overall Health Score
                  </div>
                  <div className="text-4xl font-bold text-green-600 mb-1">
                    8.2 / 10
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    ↑ +0.5 from last month
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg mb-4">
                <div className="text-sm font-bold text-foreground mb-2">📊 What This Means:</div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  Account is healthy and stable. Product usage is strong at 82%, and support tickets are minimal.
                </div>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="text-sm font-bold text-primary mb-3">🎯 Recommended Actions:</div>
                <div className="text-sm text-foreground mb-3 pl-6 relative">
                  <span className="absolute left-0 font-bold">→</span>
                  Schedule advanced feature training
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Renewal Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">Days Until Renewal</div>
                <div className="text-3xl font-bold text-amber-600 mb-2">75 Days</div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Renewal date: <strong>January 15, 2026</strong>. Renewal is 85% likely based on health metrics.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Stakeholder Map</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <div className="p-4 rounded-lg bg-amber-50 border-l-4 border-amber-500">
                <div className="text-sm font-bold mb-1 text-foreground">
                  ⭐ Mike Johnson - Champion
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  VP Operations • Last Touch: 2 days ago
                </div>
                <div className="text-xs text-foreground leading-relaxed space-y-1">
                  <div><strong>Power:</strong> Budget authority</div>
                  <div><strong>Engagement:</strong> Very High</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
