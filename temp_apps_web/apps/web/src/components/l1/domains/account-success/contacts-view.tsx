/**
 * Contacts View — Grid with contact cards, communication heatmap, sentiment
 * CSM Intelligence L1 Workspace
 */
import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Mail,
  Calendar,
  MessageSquare,
  Phone,
  ExternalLink,
  X,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { getSentimentColor, type CSMContact } from "./csm-data";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";

export function ContactsView() {
  const { data: allContacts, isLoading, error } = useWorkspaceEntities<CSMContact>("contact");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState<CSMContact | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading contacts...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-64 text-iw-red">
        Failed to load contacts: {error}
      </div>
    );
  if (allContacts.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p className="text-lg font-medium">No contacts yet</p>
        <p className="text-sm">Connect a CRM to see your contacts here.</p>
      </div>
    );

  const filtered = useMemo(() => {
    return allContacts.filter((c) => {
      if (
        search &&
        !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.accountName.toLowerCase().includes(search.toLowerCase()) &&
        !c.title.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (roleFilter !== "all" && c.role !== roleFilter) return false;
      if (sentimentFilter !== "all" && c.sentiment !== sentimentFilter) return false;
      return true;
    });
  }, [search, roleFilter, sentimentFilter]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-[var(--iw-success)]/30"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${showFilters ? "bg-[var(--iw-success)]/10 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{filtered.length} contacts</span>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-success)] text-white hover:opacity-90">
              <Plus className="w-3.5 h-3.5" /> Add Contact
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border flex-wrap">
            <span className="text-xs text-muted-foreground">Role:</span>
            {["all", "champion", "decision-maker", "executive", "technical", "end-user"].map(
              (r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${roleFilter === r ? "bg-[var(--iw-success)]/15 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                  style={{ fontWeight: roleFilter === r ? 600 : 400 }}
                >
                  {r === "all"
                    ? "All"
                    : r
                        .split("-")
                        .map((w) => w[0].toUpperCase() + w.slice(1))
                        .join(" ")}
                </button>
              )
            )}
            <div className="w-px h-4 bg-border" />
            <span className="text-xs text-muted-foreground">Sentiment:</span>
            {["all", "positive", "neutral", "at-risk", "negative"].map((s) => (
              <button
                key={s}
                onClick={() => setSentimentFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${sentimentFilter === s ? "bg-[var(--iw-success)]/15 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                style={{ fontWeight: sentimentFilter === s ? 600 : 400 }}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contact Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-sm flex-shrink-0"
                  style={{ fontWeight: 600 }}
                >
                  {contact.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm truncate" style={{ fontWeight: 600 }}>
                    {contact.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">{contact.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {contact.accountName}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getSentimentColor(contact.sentiment) }}
                  />
                  <span className="text-[10px] capitalize text-muted-foreground">
                    {contact.sentiment.replace("-", " ")}
                  </span>
                </div>
              </div>

              {/* Communication Heatmap */}
              <div className="mb-3 p-2 bg-secondary/50 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-muted-foreground" style={{ fontWeight: 500 }}>
                    Communication
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Last:{" "}
                    {contact.lastContactDays === 0 ? "Today" : `${contact.lastContactDays}d ago`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <HeatCell
                    icon={<Mail className="w-3 h-3" />}
                    label="Email"
                    count={contact.emailCount}
                  />
                  <HeatCell
                    icon={<Calendar className="w-3 h-3" />}
                    label="Meetings"
                    count={contact.meetingCount}
                  />
                  <HeatCell
                    icon={<MessageSquare className="w-3 h-3" />}
                    label="Slack"
                    count={contact.slackMessages}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize"
                  style={{ fontWeight: 500 }}
                >
                  {contact.role.replace("-", " ")}
                </span>
                {contact.nps !== null && (
                  <span className="text-[10px] text-muted-foreground">
                    NPS:{" "}
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          contact.nps >= 7
                            ? "var(--iw-success)"
                            : contact.nps >= 5
                              ? "var(--iw-warning)"
                              : "var(--iw-danger)",
                      }}
                    >
                      {contact.nps}
                    </span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Detail Drawer */}
      {selectedContact && (
        <ContactDetailDrawer contact={selectedContact} onClose={() => setSelectedContact(null)} />
      )}
    </div>
  );
}

function HeatCell({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  const intensity = Math.min(count / 50, 1);
  const color = `rgba(0, 200, 83, ${0.1 + intensity * 0.4})`;
  return (
    <div
      className="flex-1 flex flex-col items-center gap-0.5 p-1.5 rounded"
      style={{ backgroundColor: color }}
    >
      {icon}
      <span className="text-[9px]" style={{ fontWeight: 600 }}>
        {count}
      </span>
      <span className="text-[8px] text-muted-foreground">{label}</span>
    </div>
  );
}

function ContactDetailDrawer({ contact, onClose }: { contact: CSMContact; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-lg"
                style={{ fontWeight: 600 }}
              >
                {contact.avatar}
              </div>
              <div>
                <h3 className="text-lg" style={{ fontWeight: 600 }}>
                  {contact.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {contact.title} · {contact.accountName}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getSentimentColor(contact.sentiment) }}
                  />
                  <span
                    className="text-[11px] capitalize"
                    style={{ color: getSentimentColor(contact.sentiment), fontWeight: 500 }}
                  >
                    {contact.sentiment.replace("-", " ")}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[var(--iw-success)] text-white hover:opacity-90">
              <Mail className="w-3 h-3" /> Email
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
              <Phone className="w-3 h-3" /> Call
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
              <Calendar className="w-3 h-3" /> Schedule
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <DetailRow label="Email" value={contact.email} />
            <DetailRow label="Phone" value={contact.phone} />
            <DetailRow
              label="Role"
              value={contact.role
                .split("-")
                .map((w) => w[0].toUpperCase() + w.slice(1))
                .join(" ")}
            />
            <DetailRow
              label="Last Contact"
              value={
                contact.lastContactDays === 0 ? "Today" : `${contact.lastContactDays} days ago`
              }
            />
            <DetailRow
              label="NPS Score"
              value={contact.nps !== null ? `${contact.nps}/10` : "N/A"}
            />
            <DetailRow label="Sources" value={contact.sources.join(", ")} />
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="text-xs mb-3" style={{ fontWeight: 600 }}>
              Communication Summary
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg" style={{ fontWeight: 700 }}>
                  {contact.emailCount}
                </p>
                <p className="text-[10px] text-muted-foreground">Emails</p>
              </div>
              <div>
                <p className="text-lg" style={{ fontWeight: 700 }}>
                  {contact.meetingCount}
                </p>
                <p className="text-[10px] text-muted-foreground">Meetings</p>
              </div>
              <div>
                <p className="text-lg" style={{ fontWeight: 700 }}>
                  {contact.slackMessages}
                </p>
                <p className="text-[10px] text-muted-foreground">Messages</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm" style={{ fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}
