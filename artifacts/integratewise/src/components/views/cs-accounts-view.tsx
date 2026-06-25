import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCOUNTS = [
  { id: "1", name: "DataFlow Inc", segment: "Enterprise", industry: "Technology", csm: "Sarah Kim", arr: 320000, health: 9.1, status: "healthy", renewalDate: "2026-03-10", lastTouch: "2025-10-30" },
  { id: "2", name: "Nexlify", segment: "Mid-Market", industry: "SaaS", csm: "Sarah Kim", arr: 240000, health: 8.2, status: "healthy", renewalDate: "2026-01-15", lastTouch: "2025-10-28" },
  { id: "3", name: "TechCorp", segment: "Mid-Market", industry: "FinTech", csm: "Mike Lee", arr: 180000, health: 6.5, status: "at-risk", renewalDate: "2025-12-20", lastTouch: "2025-10-25" },
  { id: "4", name: "CloudScale", segment: "Enterprise", industry: "Cloud", csm: "Sarah Kim", arr: 450000, health: 9.5, status: "healthy", renewalDate: "2026-06-01", lastTouch: "2025-10-29" },
  { id: "5", name: "StartupXYZ", segment: "SMB", industry: "Startup", csm: "Mike Lee", arr: 85000, health: 5.2, status: "at-risk", renewalDate: "2025-11-15", lastTouch: "2025-09-15" },
];

type HealthStatus = "healthy" | "at-risk" | "all";

const fmt$ = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const healthColor = (h: number) => h >= 8 ? "text-green-600" : h >= 6 ? "text-amber-600" : "text-red-600";
const statusBadge = (s: string) => ({
  healthy: "bg-green-100 text-green-800 border-green-500",
  "at-risk": "bg-amber-100 text-amber-800 border-amber-500",
  active: "bg-blue-100 text-blue-800 border-blue-500",
  churned: "bg-red-100 text-red-800 border-red-500",
}[s] || "bg-muted text-muted-foreground");

export function CSAccountsView() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<HealthStatus>("all");

  const kpis = useMemo(() => {
    const totalARR = ACCOUNTS.reduce((s, a) => s + a.arr, 0);
    const avgHealth = (ACCOUNTS.reduce((s, a) => s + a.health, 0) / ACCOUNTS.length).toFixed(1);
    const atRisk = ACCOUNTS.filter((a) => a.status === "at-risk").length;
    const renewals90d = ACCOUNTS.filter((a) => {
      const days = Math.ceil((new Date(a.renewalDate).getTime() - Date.now()) / 86400000);
      return days <= 90 && days > 0;
    });
    return { total: ACCOUNTS.length, totalARR, avgHealth, atRisk, renewals90d: renewals90d.length, renewalValue: renewals90d.reduce((s, a) => s + a.arr, 0) };
  }, []);

  const rows = useMemo(() =>
    ACCOUNTS.filter((a) =>
      [a.name, a.csm, a.industry].some((f) => f.toLowerCase().includes(q.toLowerCase())) &&
      (filter === "all" || a.status === filter)
    ), [q, filter]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Accounts Hub</h1>
        <p className="text-base text-muted-foreground max-w-3xl">Comprehensive overview of all customer accounts with health metrics and revenue tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {[
          { label: "Total Accounts", value: kpis.total, sub: "+2 This Quarter", subColor: "text-green-600" },
          { label: "Total ARR", value: fmt$(kpis.totalARR), sub: "+15% YoY", subColor: "text-green-600" },
          { label: "Avg Health", value: kpis.avgHealth, sub: "+0.3 This Month", subColor: "text-green-600" },
          { label: "At Risk", value: kpis.atRisk, sub: "+1 This Week", subColor: "text-red-600" },
          { label: "Renewals (90d)", value: kpis.renewals90d, sub: `${fmt$(kpis.renewalValue)} Value`, subColor: "text-green-600" },
        ].map((k) => (
          <Card key={k.label} className="border-t-4 border-t-primary/80">
            <CardContent className="p-6">
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">{k.label}</div>
              <div className="text-3xl font-bold mb-2">{k.value}</div>
              <div className={cn("text-sm font-semibold", k.subColor)}>{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search by account name, CSM, or industry..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
            </div>
            {(["all", "healthy", "at-risk"] as HealthStatus[]).map((f) => (
              <Button key={f} variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                {f === "all" ? `All (${ACCOUNTS.length})` : f === "healthy" ? `Healthy (${ACCOUNTS.filter((a) => a.status === "healthy").length})` : `At Risk (${ACCOUNTS.filter((a) => a.status === "at-risk").length})`}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Accounts</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead><TableHead>CSM</TableHead><TableHead>ARR</TableHead>
                <TableHead>Health</TableHead><TableHead>Status</TableHead>
                <TableHead>Renewal Date</TableHead><TableHead>Last Touch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="font-semibold">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.segment} · {a.industry}</div>
                  </TableCell>
                  <TableCell>{a.csm}</TableCell>
                  <TableCell><span className="font-bold">{fmt$(a.arr)}</span></TableCell>
                  <TableCell><span className={cn("font-bold text-lg", healthColor(a.health))}>{a.health}</span></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("border", statusBadge(a.status))}>
                      {a.status === "at-risk" ? "At Risk" : a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{fmtDate(a.renewalDate)}</TableCell>
                  <TableCell>{fmtDate(a.lastTouch)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
