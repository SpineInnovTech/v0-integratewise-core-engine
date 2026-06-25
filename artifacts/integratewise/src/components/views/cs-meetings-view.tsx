import { useState } from "react";
import { Search, Video, Calendar, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MEETINGS = [
  { id: "MEET-00523", title: "Weekly Check-in Meeting", accountName: "Nexlify", date: "2025-11-01", time: "14:00", duration: 60, type: "check-in", status: "scheduled", attendees: ["Sarah Kim", "Mike Johnson"] },
  { id: "MEET-00524", title: "Q4 Business Review", accountName: "CloudScale", date: "2025-11-05", time: "10:00", duration: 90, type: "qbr", status: "scheduled", attendees: ["Nirmal", "Alex Chen", "Sarah Kim"] },
  { id: "MEET-00525", title: "Onboarding Kickoff", accountName: "StartupXYZ", date: "2025-10-30", time: "11:00", duration: 45, type: "onboarding", status: "completed", attendees: ["Nirmal", "Mike Lee"] },
  { id: "MEET-00526", title: "Renewal Discussion", accountName: "TechCorp", date: "2025-11-08", time: "15:30", duration: 60, type: "renewal", status: "scheduled", attendees: ["Nirmal", "Lisa Park"] },
];

const statusColor: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-500",
  completed: "bg-green-100 text-green-800 border-green-500",
  cancelled: "bg-red-100 text-red-800 border-red-500",
};

const typeColor: Record<string, string> = {
  "check-in": "bg-purple-100 text-purple-800",
  qbr: "bg-amber-100 text-amber-800",
  onboarding: "bg-green-100 text-green-800",
  renewal: "bg-blue-100 text-blue-800",
};

export function CSMeetingsView() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = MEETINGS.filter((m) =>
    [m.title, m.accountName].some((f) => f.toLowerCase().includes(q.toLowerCase())) &&
    (filter === "all" || m.type === filter)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Meetings &amp; Calls</h1>
        <p className="text-base text-muted-foreground max-w-3xl">Customer engagement calendar and call management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Total Meetings", value: MEETINGS.length },
          { label: "Scheduled", value: MEETINGS.filter((m) => m.status === "scheduled").length },
          { label: "Completed", value: MEETINGS.filter((m) => m.status === "completed").length },
          { label: "This Week", value: 3 },
        ].map((k) => (
          <Card key={k.label} className="border-t-4 border-t-primary/80">
            <CardContent className="p-6">
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">{k.label}</div>
              <div className="text-3xl font-bold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search meetings by title or account..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
        {["all", "check-in", "qbr", "renewal", "onboarding"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "all" ? "All Meetings" : f.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((m) => (
          <Card key={m.id} className="border-2 hover:border-primary/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-mono text-xs text-muted-foreground mb-2">{m.id}</div>
                  <div className="text-lg font-bold mb-2">{m.title}</div>
                  <div className="flex gap-2 mb-4">
                    <Badge className={cn("text-xs", typeColor[m.type] || "")}>{m.type.toUpperCase()}</Badge>
                    <Badge variant="outline" className={cn("text-xs border", statusColor[m.status] || "")}>{m.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {m.date} at {m.time}</div>
                    <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {m.duration} min</div>
                    <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {m.attendees.join(", ")}</div>
                    <div className="font-medium text-foreground">{m.accountName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {m.status === "scheduled" && (
                    <Button size="sm" className="gap-1.5"><Video className="h-4 w-4" />Join</Button>
                  )}
                  <Button size="sm" variant="outline">Notes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
