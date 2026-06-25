import { useState } from "react";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CONTACTS = [
  { id: "CONT-00847", name: "Mike Johnson", title: "CTO", department: "Engineering", email: "mike.j@nexlify.com", phone: "(415) 555-0123", accountId: "2", accountName: "Nexlify", influenceLevel: "champion", relationshipStrength: "strong", lastContact: "2 days ago" },
  { id: "CONT-00848", name: "Lisa Park", title: "VP Product", department: "Product", email: "lisa.p@techcorp.com", phone: "(415) 555-0456", accountId: "3", accountName: "TechCorp", influenceLevel: "influencer", relationshipStrength: "moderate", lastContact: "5 days ago" },
  { id: "CONT-00849", name: "Alex Chen", title: "CEO", department: "Executive", email: "alex.c@cloudscale.com", phone: "(415) 555-0789", accountId: "4", accountName: "CloudScale", influenceLevel: "decision-maker", relationshipStrength: "strong", lastContact: "1 day ago" },
  { id: "CONT-00850", name: "Sara Ali", title: "Head of Engineering", department: "Engineering", email: "sara.a@dataflow.com", phone: "(415) 555-0321", accountId: "1", accountName: "DataFlow Inc", influenceLevel: "champion", relationshipStrength: "strong", lastContact: "3 days ago" },
];

const influenceBadge: Record<string, string> = {
  champion: "bg-green-100 text-green-800 border-green-500",
  "decision-maker": "bg-blue-100 text-blue-800 border-blue-500",
  influencer: "bg-purple-100 text-purple-800 border-purple-500",
  blocker: "bg-red-100 text-red-800 border-red-500",
};

export function CSContactsView() {
  const [q, setQ] = useState("");

  const filtered = CONTACTS.filter((c) =>
    [c.name, c.title, c.accountName, c.email].some((f) => f.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Contacts &amp; Stakeholders Hub</h1>
        <p className="text-base text-muted-foreground max-w-3xl">Customer relationships, champions, and MEDDIC influence mapping</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Contacts", value: CONTACTS.length, sub: "Across all accounts" },
          { label: "Champions", value: CONTACTS.filter((c) => c.influenceLevel === "champion").length, sub: "Ready to advocate" },
          { label: "Decision Makers", value: CONTACTS.filter((c) => c.influenceLevel === "decision-maker").length, sub: "Executive sponsors" },
          { label: "Strong Relations", value: CONTACTS.filter((c) => c.relationshipStrength === "strong").length, sub: "High trust contacts" },
        ].map((k) => (
          <Card key={k.label} className="border-t-4 border-t-primary/80">
            <CardContent className="p-6">
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">{k.label}</div>
              <div className="text-3xl font-bold mb-2">{k.value}</div>
              <div className="text-sm text-muted-foreground">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search contacts by name, title, account, or email..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
        <Button variant="default">All Contacts</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Stakeholder Map</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c) => (
              <Card key={c.id} className="border-2">
                <CardContent className="p-6">
                  <div className="font-mono text-xs text-muted-foreground mb-2">{c.id}</div>
                  <div className="text-lg font-bold mb-1">{c.name}</div>
                  <div className="text-sm text-muted-foreground mb-0.5">{c.title}</div>
                  <div className="text-sm text-muted-foreground mb-3">{c.department}</div>
                  <div className="flex gap-2 mb-4">
                    <Badge variant="outline" className={`border ${influenceBadge[c.influenceLevel] || ""} text-xs`}>
                      {c.influenceLevel.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">{c.relationshipStrength}</Badge>
                  </div>
                  <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
                    <div>Email: {c.email}</div>
                    <div>Phone: {c.phone}</div>
                    <div>Last Contact: {c.lastContact}</div>
                    <div className="mt-2">Account: <Link href={`/clients`} className="text-primary font-semibold hover:underline">{c.accountName}</Link></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
