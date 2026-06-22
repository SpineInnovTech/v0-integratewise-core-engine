/**
 * Meetings View — Calendar-style + list view
 * CSM Intelligence L1 Workspace
 */
import { useState, useMemo } from "react";
import {
  Calendar, List, Plus, Clock, Video, FileText,
  Users, ChevronLeft, ChevronRight, MoreHorizontal,
  CheckCircle, XCircle,
} from "lucide-react";
import { meetings as allMeetings, type CSMMeeting } from "./csm-data";

type ViewMode = "agenda" | "list";

const typeColors: Record<string, { bg: string; text: string; label: string }> = {
  qbr: { bg: "rgba(0, 102, 255, 0.1)", text: "var(--iw-blue)", label: "QBR" },
  "check-in": { bg: "rgba(0, 200, 83, 0.1)", text: "var(--iw-success)", label: "Check-in" },
  onboarding: { bg: "rgba(124, 77, 255, 0.1)", text: "var(--iw-purple)", label: "Onboarding" },
  ebr: { bg: "rgba(255, 152, 0, 0.1)", text: "var(--iw-warning)", label: "EBR" },
  internal: { bg: "rgba(189, 189, 189, 0.1)", text: "var(--muted-foreground)", label: "Internal" },
  training: { bg: "rgba(0, 200, 83, 0.1)", text: "var(--iw-success)", label: "Training" },
};

export function MeetingsView() {
  const [mode, setMode] = useState<ViewMode>("agenda");
  const [filter, setFilter] = useState("all");

  const today = "2026-02-10";
  const sorted = useMemo(() => {
    let list = [...allMeetings];
    if (filter !== "all") list = list.filter(m => m.type === filter);
    return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [filter]);

  const upcoming = sorted.filter(m => m.startTime >= today && m.status === "scheduled");
  const past = sorted.filter(m => m.status === "completed");

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>Meetings</h2>
            <div className="flex items-center gap-1.5">
              {["all", "qbr", "check-in", "ebr", "training", "internal"].map(t => (
                <button key={t} onClick={() => setFilter(t)} className={`px-2.5 py-1 text-xs rounded-full transition-colors ${filter === t ? "bg-[var(--iw-success)]/15 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground hover:text-foreground"}`} style={{ fontWeight: filter === t ? 600 : 400 }}>
                  {t === "all" ? "All" : (typeColors[t]?.label || t)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-secondary rounded-lg p-0.5">
              {([["agenda", Calendar], ["list", List]] as [ViewMode, any][]).map(([id, Icon]) => (
                <button key={id} onClick={() => setMode(id)} className={`p-1.5 rounded-md transition-colors ${mode === id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-success)] text-white hover:opacity-90">
              <Plus className="w-3.5 h-3.5" /> Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Upcoming */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[var(--iw-blue)]" />
            <h3 className="text-sm" style={{ fontWeight: 600 }}>Upcoming ({upcoming.length})</h3>
          </div>
          {mode === "agenda" ? <AgendaView meetings={upcoming} /> : <MeetingList meetings={upcoming} />}
        </div>

        {/* Past */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-[var(--iw-success)]" />
            <h3 className="text-sm" style={{ fontWeight: 600 }}>Completed ({past.length})</h3>
          </div>
          {mode === "agenda" ? <AgendaView meetings={past} /> : <MeetingList meetings={past} />}
        </div>
      </div>
    </div>
  );
}

function AgendaView({ meetings }: { meetings: CSMMeeting[] }) {
  // Group by date
  const byDate: Record<string, CSMMeeting[]> = {};
  for (const m of meetings) {
    const date = m.startTime.split("T")[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(m);
  }

  return (
    <div className="space-y-4">
      {Object.entries(byDate).map(([date, items]) => {
        const d = new Date(date);
        const isToday = date === "2026-02-10";
        return (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${isToday ? "bg-[var(--iw-success)]/15 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground"}`} style={{ fontWeight: 600 }}>
                {isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="space-y-2 ml-2 border-l-2 border-border pl-4">
              {items.map(m => <MeetingCard key={m.id} meeting={m} />)}
            </div>
          </div>
        );
      })}
      {meetings.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No meetings</p>
      )}
    </div>
  );
}

function MeetingCard({ meeting: m }: { meeting: CSMMeeting }) {
  const tc = typeColors[m.type] || typeColors.internal;
  const time = m.startTime.split("T")[1];
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-center min-w-[48px]">
          <p className="text-sm" style={{ fontWeight: 700 }}>{time}</p>
          <p className="text-[10px] text-muted-foreground">{m.duration}min</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm truncate" style={{ fontWeight: 600 }}>{m.title}</h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: tc.bg, color: tc.text, fontWeight: 600 }}>
              {tc.label}
            </span>
          </div>
          {m.accountName && <p className="text-[11px] text-muted-foreground mb-2">{m.accountName}</p>}
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-1.5">
              {m.participants.slice(0, 4).map((p, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[8px]" style={{ fontWeight: 600 }} title={`${p.name} (${p.role})`}>
                  {p.initials}
                </div>
              ))}
              {m.participants.length > 4 && (
                <div className="w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[8px] text-muted-foreground">
                  +{m.participants.length - 4}
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{m.participants.length} participants</span>
            <div className="flex items-center gap-2 ml-auto">
              {m.hasNotes && <FileText className="w-3.5 h-3.5 text-muted-foreground" title="Notes available" />}
              {m.hasRecording && <Video className="w-3.5 h-3.5 text-muted-foreground" title="Recording available" />}
              {m.followUpTasks > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--iw-blue)]/10 text-[var(--iw-blue)]" style={{ fontWeight: 500 }}>
                  {m.followUpTasks} follow-ups
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetingList({ meetings }: { meetings: CSMMeeting[] }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
        <span>Time</span><span>Meeting</span><span>Type</span><span>Account</span><span>Participants</span>
      </div>
      {meetings.map(m => {
        const tc = typeColors[m.type] || typeColors.internal;
        return (
          <div key={m.id} className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer items-center">
            <div>
              <p className="text-sm" style={{ fontWeight: 500 }}>{m.startTime.split("T")[1]}</p>
              <p className="text-[10px] text-muted-foreground">{m.duration}min</p>
            </div>
            <div className="min-w-0">
              <p className="text-sm truncate" style={{ fontWeight: 500 }}>{m.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {m.hasNotes && <FileText className="w-3 h-3 text-muted-foreground" />}
                {m.hasRecording && <Video className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full inline-flex w-fit" style={{ backgroundColor: tc.bg, color: tc.text, fontWeight: 600 }}>
              {tc.label}
            </span>
            <span className="text-xs text-muted-foreground truncate">{m.accountName || "—"}</span>
            <div className="flex items-center -space-x-1">
              {m.participants.slice(0, 3).map((p, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[8px]" style={{ fontWeight: 600 }}>
                  {p.initials}
                </div>
              ))}
              {m.participants.length > 3 && <span className="text-[10px] text-muted-foreground ml-1.5">+{m.participants.length - 3}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
