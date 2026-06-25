import { Link } from "wouter";
import { ArrowLeft, Star, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ACCOUNTS: Record<string, {
  name: string; segment: string; arr: number; health: number;
  renewalDate: string; renewalDays: number; renewalLikelihood: number;
  description: string; champion: { name: string; title: string; lastTouch: string; power: string; engagement: string };
}> = {
  "1": { name: "DataFlow Inc", segment: "Enterprise", arr: 320000, health: 9.1, renewalDate: "Mar 10, 2026", renewalDays: 259, renewalLikelihood: 94, description: "Product usage is strong at 91%, and support tickets are minimal.", champion: { name: "Sara Ali", title: "Head of Engineering", lastTouch: "3 days ago", power: "Budget authority", engagement: "Very High" } },
  "2": { name: "Nexlify", segment: "Mid-Market", arr: 240000, health: 8.2, renewalDate: "Jan 15, 2026", renewalDays: 75, renewalLikelihood: 85, description: "Account is healthy and stable. Product usage is strong at 82%, and support tickets are minimal.", champion: { name: "Mike Johnson", title: "VP Operations", lastTouch: "2 days ago", power: "Budget authority", engagement: "Very High" } },
  "3": { name: "TechCorp", segment: "Mid-Market", arr: 180000, health: 6.5, renewalDate: "Dec 20, 2025", renewalDays: 38, renewalLikelihood: 60, description: "Account shows reduced product usage over the last 30 days. Escalation recommended.", champion: { name: "Lisa Park", title: "VP Product", lastTouch: "5 days ago", power: "Influencer", engagement: "Moderate" } },
  "4": { name: "CloudScale", segment: "Enterprise", arr: 450000, health: 9.5, renewalDate: "Jun 1, 2026", renewalDays: 340, renewalLikelihood: 97, description: "Flagship account. Extremely high product adoption. Expansion opportunity active.", champion: { name: "Alex Chen", title: "CEO", lastTouch: "1 day ago", power: "Executive sponsor", engagement: "Very High" } },
};

const fmt$ = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;

export function CSAccountDetailView({ accountId }: { accountId: string }) {
  const acct = ACCOUNTS[accountId];

  if (!acct) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Account <code>{accountId}</code> not found.</p>
        <Link href="/cs-accounts"><Button variant="outline" className="mt-4"><ArrowLeft className="h-4 w-4 mr-2" />Back to Accounts</Button></Link>
      </div>
    );
  }

  const isAtRisk = acct.renewalDays < 60 || acct.health < 7;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="bg-gradient-to-br from-primary via-primary to-primary/90 rounded-xl p-6 text-primary-foreground shadow-lg">
        <Link href="/cs-accounts" className="text-sm mb-4 inline-flex items-center gap-2 opacity-90 hover:opacity-100">
          <ArrowLeft className="w-4 h-4" />Back to Accounts Hub
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-3 tracking-tight">{acct.name}</h1>
            <div className="text-base opacity-90">{acct.segment} · {fmt$(acct.arr)} ARR · Renewal: {acct.renewalDate} ({acct.renewalDays} days)</div>
          </div>
          <div className="flex gap-3">
            <Button className="bg-background text-primary hover:bg-background/90">Schedule QBR</Button>
            <Button variant="outline" className="bg-transparent border-background text-background hover:bg-background/20">Export Report</Button>
          </div>
        </div>
      </div>

      {isAtRisk && (
        <div className="bg-amber-500/10 border-l-4 border-amber-500/80 rounded-xl p-6 flex justify-between items-center">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-lg font-bold text-amber-900 mb-2">Action Required: {acct.renewalDays < 60 ? "Renewal Approaching" : "Health Intervention Needed"}</div>
              <div className="text-sm text-amber-800 leading-relaxed">
                {acct.renewalDays < 60
                  ? `Renewal in ${acct.renewalDays} days. Schedule QBR immediately to discuss expansion and ensure continuation.`
                  : "Account health below threshold. Increased engagement and onboarding support recommended."}
              </div>
            </div>
          </div>
          <Button className="bg-amber-500/90 text-white hover:bg-amber-500 ml-4">Schedule Now</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="border-l-4 border-l-primary/80">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">Overall Health Score</div>
                  <div className={`text-4xl font-bold mb-1 ${acct.health >= 8 ? "text-green-600" : acct.health >= 6 ? "text-amber-600" : "text-red-600"}`}>
                    {acct.health} / 10
                  </div>
                  <div className={`text-sm font-semibold ${acct.health >= 8 ? "text-green-600" : "text-amber-600"}`}>
                    {acct.health >= 8 ? "↑ Healthy & Stable" : "↓ Needs Attention"}
                  </div>
                </div>
                <Badge variant="outline" className={acct.health >= 8 ? "bg-green-100 text-green-800 border-green-500" : "bg-amber-100 text-amber-800 border-amber-500"}>
                  {acct.health >= 8 ? "Healthy" : "At Risk"}
                </Badge>
              </div>
              <div className="bg-muted p-4 rounded-lg mb-4">
                <div className="text-sm font-bold mb-2">What This Means:</div>
                <div className="text-sm text-muted-foreground">{acct.description}</div>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="text-sm font-bold text-primary mb-3">Recommended Actions:</div>
                <div className="space-y-2 text-sm">
                  {(acct.health >= 8
                    ? ["Schedule advanced feature training", "Propose expansion scope", "Request referral / case study"]
                    : ["Schedule executive check-in this week", "Review support ticket backlog", "Re-run onboarding for new team members"]
                  ).map((action) => (
                    <div key={action} className="pl-4 relative"><span className="absolute left-0 font-bold">→</span>{action}</div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-xl">Renewal Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className={`p-4 rounded-lg ${acct.renewalDays < 60 ? "bg-amber-50" : "bg-green-50"}`}>
                <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">Days Until Renewal</div>
                <div className={`text-3xl font-bold mb-2 ${acct.renewalDays < 60 ? "text-amber-600" : "text-green-600"}`}>{acct.renewalDays} Days</div>
                <div className="text-xs text-muted-foreground">
                  Renewal date: <strong>{acct.renewalDate}</strong>. {acct.renewalLikelihood}% renewal probability based on health metrics.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Stakeholder Map</CardTitle></CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-amber-50 border-l-4 border-amber-500">
                <div className="text-sm font-bold mb-1 flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-amber-500" />{acct.champion.name} — Champion
                </div>
                <div className="text-xs text-muted-foreground mb-3">{acct.champion.title} · Last Touch: {acct.champion.lastTouch}</div>
                <div className="text-xs space-y-1">
                  <div><strong>Power:</strong> {acct.champion.power}</div>
                  <div><strong>Engagement:</strong> {acct.champion.engagement}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
