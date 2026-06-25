import { useState } from "react";
import {
  Ticket,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { useHydrateDomainTable } from "@/components/core/hydration/use-hydrate-projection";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-iw-slate/10 text-iw-slate",
  "in-progress": "bg-iw-gold/10 text-iw-gold",
  waiting: "bg-iw-slate-mid/10 text-iw-slate",
  resolved: "bg-iw-forest/10 text-iw-forest",
  closed: "bg-gray-100 text-gray-500",
};

const PRIORITY_ICONS: Record<string, string> = {
  critical: "text-iw-red",
  high: "text-iw-gold-light",
  medium: "text-iw-gold",
  low: "text-gray-400",
};

export function TicketsView() {
  const { data, loading } = useHydrateDomainTable<any>("service", "tickets");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const tickets = data?.items || [];
  const filtered = tickets.filter((t: any) => {
    if (search && !t.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Tickets
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Support tickets across all channels.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {["all", "open", "in-progress", "waiting", "resolved"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${statusFilter === s ? "bg-primary/10 text-primary font-medium" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {s === "all" ? "All" : s.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs">
              <th className="text-left px-4 py-2.5 font-medium">Ticket</th>
              <th className="text-left px-4 py-2.5 font-medium">Requester</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="text-left px-4 py-2.5 font-medium">Priority</th>
              <th className="text-left px-4 py-2.5 font-medium">Assigned</th>
              <th className="text-left px-4 py-2.5 font-medium">Updated</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  No tickets found
                </td>
              </tr>
            ) : (
              filtered.map((ticket: any) => (
                <tr
                  key={ticket.id}
                  className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {ticket.subject || "Untitled"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      #{ticket.id?.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{ticket.requester || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}
                    >
                      {ticket.status || "open"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${PRIORITY_ICONS[ticket.priority] || ""}`}
                    >
                      {ticket.priority || "medium"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.assignee || "Unassigned"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {ticket.updatedAt || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 hover:bg-muted rounded">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TicketsView;
