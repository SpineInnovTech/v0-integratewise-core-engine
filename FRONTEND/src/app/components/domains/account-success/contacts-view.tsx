/**
 * Contacts View
 *
 * Surface: search, filter, click → detail drawer with Twin's read.
 * Data: hydrates from Spine when CRM connector is active.
 * No mock data — empty state explains what to connect.
 */
import { useState } from "react";
import {
  Search, Filter, Plus, Mail, Calendar, Phone, X, Check, Users, Plug,
} from "lucide-react";
import { EntityTwinPanel } from "../../twin-ui/entity-twin-panel";

// ─── Type (matches what Spine will return) ────────────────────────────────────

interface Contact {
  id: string;
  name: string;
  title: string;
  accountName: string;
  email: string;
  phone: string;
  role: string;
  sentiment: "positive" | "neutral" | "at-risk" | "negative";
  nps: number | null;
  lastContactDays: number;
  emailCount: number;
  meetingCount: number;
  slackMessages: number;
  sources: string[];
  avatar: string;
}

function getSentimentColor(s: string) {
  if (s === "positive") return "var(--iw-success)";
  if (s === "at-risk")  return "var(--iw-danger)";
  if (s === "negative") return "var(--iw-danger)";
  return "var(--muted-foreground)";
}

export function ContactsView() {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Contacts hydrate from Spine when CRM connector is active.
  // Empty until then.
  const contacts: Contact[] = [];

  const filtered = contacts.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q)
      || c.accountName.toLowerCase().includes(q)
      || c.title.toLowerCase().includes(q);
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Toolbar */}
      <div className="flex-shrink-0 border-b px-6 py-3" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--muted-foreground)" }} />
              <input type="text" placeholder="Search contacts..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)" }} />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg"
              style={{
                background: showFilters ? "var(--iw-blue-50)" : "var(--secondary)",
                color: showFilters ? "var(--iw-blue)" : "var(--muted-foreground)",
              }}>
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{filtered.length} contacts</span>
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg text-white"
              style={{ background: "var(--iw-blue)", fontWeight: 600 }}>
              <Plus className="w-3.5 h-3.5" /> Add Contact
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 mt-3 pt-3 flex-wrap"
            style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Role:</span>
            {["all", "champion", "decision-maker", "executive", "technical", "end-user"].map(r => (
              <button key={r}
                className="px-2.5 py-1 text-xs rounded-full"
                style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                {r === "all" ? "All" : r.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--secondary)" }}>
            <Users className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />
          </div>
          <p className="text-sm mb-1.5" style={{ fontWeight: 600, color: "var(--foreground)" }}>
            {search ? "No contacts match your search" : "No contacts yet"}
          </p>
          <p className="text-xs mb-4 max-w-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            {search
              ? "Try a different name, account, or title."
              : "Connect your CRM to surface contacts with communication history, sentiment signals, and Twin's read on each relationship."}
          </p>
          {!search && (
            <div className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
              style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
              <Plug className="w-3 h-3" />
              Connect Salesforce or HubSpot in Ingress to unlock this surface
            </div>
          )}
        </div>
      )}

      {/* Contact grid — renders when data is live */}
      {filtered.length > 0 && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(contact => (
              <div key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm shrink-0"
                    style={{ background: "var(--secondary)", fontWeight: 600, color: "var(--foreground)" }}>
                    {contact.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm truncate" style={{ fontWeight: 600, color: "var(--foreground)" }}>{contact.name}</h4>
                    <p className="text-[11px] truncate" style={{ color: "var(--muted-foreground)" }}>{contact.title}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--muted-foreground)" }}>{contact.accountName}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: getSentimentColor(contact.sentiment) }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                    style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                    {contact.role.replace("-", " ")}
                  </span>
                  {contact.nps !== null && (
                    <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                      NPS: <span style={{
                        fontWeight: 600,
                        color: contact.nps >= 7 ? "var(--iw-success)" : contact.nps >= 5 ? "var(--iw-warning)" : "var(--iw-danger)"
                      }}>{contact.nps}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact detail drawer */}
      {selectedContact && (
        <ContactDetailDrawer contact={selectedContact} onClose={() => setSelectedContact(null)} />
      )}
    </div>
  );
}

function ContactDetailDrawer({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const [mode, setMode] = useState<"none" | "email" | "schedule" | "call">("none");
  const [text, setText] = useState("");
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const confirm = (action: string) => {
    setConfirmed(action);
    setMode("none");
    setText("");
    setTimeout(() => setConfirmed(null), 3000);
  };

  const twinKey = contact.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, "");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full overflow-y-auto animate-in slide-in-from-right"
        style={{ background: "var(--card)", borderLeft: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4"
          style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg"
                style={{ background: "var(--secondary)", fontWeight: 600, color: "var(--foreground)" }}>
                {contact.avatar}
              </div>
              <div>
                <h3 className="text-base" style={{ fontWeight: 600, color: "var(--foreground)" }}>{contact.name}</h3>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{contact.title} · {contact.accountName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: getSentimentColor(contact.sentiment) }} />
                  <span className="text-[11px] capitalize" style={{ color: getSentimentColor(contact.sentiment), fontWeight: 500 }}>
                    {contact.sentiment.replace("-", " ")}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}><X className="w-4 h-4" /></button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {[
              { key: "email", Icon: Mail, label: "Email" },
              { key: "call", Icon: Phone, label: "Log call" },
              { key: "schedule", Icon: Calendar, label: "Schedule" },
            ].map(({ key, Icon, label }) => (
              <button key={key}
                onClick={() => setMode(mode === key as any ? "none" : key as any)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors"
                style={{
                  background: mode === key ? "var(--iw-blue)" : "var(--secondary)",
                  color: mode === key ? "white" : "var(--foreground)",
                  fontWeight: 600,
                }}>
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>

          {confirmed && (
            <div className="flex items-center gap-1.5 mt-2 text-[10px]" style={{ color: "var(--iw-success)", fontWeight: 600 }}>
              <Check className="w-3 h-3" /> {confirmed} — logged to Spine.
            </div>
          )}
        </div>

        {/* Action panels */}
        {mode !== "none" && (
          <div className="px-6 py-4 space-y-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="text-[9px] uppercase tracking-widest"
              style={{ color: "var(--iw-blue)", fontWeight: 700 }}>
              {mode === "email" ? "Compose email" : mode === "call" ? "Log call notes" : "Schedule meeting"}
            </p>

            {mode === "schedule" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] mb-1" style={{ color: "var(--muted-foreground)" }}>Date</p>
                  <input type="date" className="w-full px-3 py-2 text-xs rounded-lg"
                    style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }} />
                </div>
                <div>
                  <p className="text-[10px] mb-1" style={{ color: "var(--muted-foreground)" }}>Time</p>
                  <input type="time" defaultValue="10:00" className="w-full px-3 py-2 text-xs rounded-lg"
                    style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }} />
                </div>
              </div>
            ) : (
              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder={mode === "email" ? `Hi ${contact.name.split(" ")[0]},\n\n` : "Call notes..."}
                rows={mode === "email" ? 5 : 4}
                className="w-full px-3 py-2 text-xs rounded-lg resize-none"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }} />
            )}
            <div className="flex gap-2">
              <button onClick={() => confirm(mode === "email" ? "Email sent" : mode === "call" ? "Call logged" : "Meeting scheduled")}
                className="px-3 py-1.5 rounded-lg text-[10px] text-white"
                style={{ background: "var(--iw-blue)", fontWeight: 700 }}>
                {mode === "email" ? "Send & log" : mode === "call" ? "Log to Spine" : "Confirm & log"}
              </button>
              <button onClick={() => setMode("none")} className="px-3 py-1.5 rounded-lg text-[10px]"
                style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Contact details */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {[
              ["Email",        contact.email],
              ["Phone",        contact.phone],
              ["Role",         contact.role.split("-").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" ")],
              ["Last Contact", contact.lastContactDays === 0 ? "Today" : `${contact.lastContactDays} days ago`],
              ["NPS Score",    contact.nps !== null ? `${contact.nps}/10` : "N/A"],
              ["Sources",      contact.sources.join(", ")],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1.5"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</span>
                <span className="text-sm" style={{ fontWeight: 500, color: "var(--foreground)" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Communication summary */}
          <div className="rounded-lg p-4" style={{ background: "var(--secondary)" }}>
            <h4 className="text-xs mb-3" style={{ fontWeight: 600, color: "var(--foreground)" }}>Communication</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[["Emails", contact.emailCount], ["Meetings", contact.meetingCount], ["Messages", contact.slackMessages]].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-lg" style={{ fontWeight: 700, color: "var(--foreground)" }}>{val}</p>
                  <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Twin panel */}
          <EntityTwinPanel entityType="contact" entityKey={twinKey} entityName={contact.name} />
        </div>
      </div>
    </div>
  );
}
