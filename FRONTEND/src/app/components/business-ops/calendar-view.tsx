import { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Video,
  Phone,
  Users,
  MapPin,
  ExternalLink,
  Filter,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  type: "qbr" | "standup" | "renewal" | "meeting" | "milestone" | "webinar";
  source: string;
  attendees: number;
  account?: string;
  location?: string;
}

const events: CalendarEvent[] = [
  { id: "e1", title: "APAC Ops Daily Standup", date: "2026-02-09", time: "09:00 IST", duration: "15 min", type: "standup", source: "Google Cal", attendees: 5, location: "Zoom" },
  { id: "e2", title: "TechServe India - QBR Prep", date: "2026-02-09", time: "11:00 IST", duration: "45 min", type: "qbr", source: "Google Cal", attendees: 3, account: "TechServe India", location: "Meet" },
  { id: "e3", title: "Stripe Integration Review", date: "2026-02-09", time: "14:00 IST", duration: "30 min", type: "meeting", source: "Google Cal", attendees: 2, location: "Zoom" },
  { id: "e4", title: "CloudBridge APAC QBR", date: "2026-02-10", time: "10:00 SGT", duration: "1h", type: "qbr", source: "Salesforce", attendees: 6, account: "CloudBridge APAC", location: "In-Person" },
  { id: "e5", title: "FinanceFlow Renewal Discussion", date: "2026-02-10", time: "15:00 IST", duration: "30 min", type: "renewal", source: "Google Cal", attendees: 4, account: "FinanceFlow Solutions", location: "Zoom" },
  { id: "e6", title: "LogiPrime Renewal Deadline", date: "2026-02-11", time: "All Day", duration: "—", type: "milestone", source: "Salesforce", attendees: 0, account: "LogiPrime Corp" },
  { id: "e7", title: "Marketing Attribution Workshop", date: "2026-02-11", time: "14:00 IST", duration: "1h", type: "webinar", source: "Google Cal", attendees: 12, location: "Zoom" },
  { id: "e8", title: "APAC Ops Weekly Sync", date: "2026-02-12", time: "09:30 IST", duration: "30 min", type: "standup", source: "Google Cal", attendees: 8, location: "Meet" },
  { id: "e9", title: "DataVault Australia Check-in", date: "2026-02-12", time: "11:00 AEST", duration: "30 min", type: "meeting", source: "Google Cal", attendees: 3, account: "DataVault Australia", location: "Zoom" },
  { id: "e10", title: "Stripe Revenue Milestone", date: "2026-02-13", time: "All Day", duration: "—", type: "milestone", source: "Stripe", attendees: 0 },
  { id: "e11", title: "EduSpark Onboarding Call", date: "2026-02-13", time: "15:00 IST", duration: "45 min", type: "meeting", source: "Google Cal", attendees: 4, account: "EduSpark Learning", location: "Meet" },
  { id: "e12", title: "HealthTech QBR Preparation", date: "2026-02-14", time: "10:00 IST", duration: "30 min", type: "qbr", source: "Salesforce", attendees: 3, account: "HealthTech Innovations" },
];

const typeConfig: Record<string, { color: string; label: string }> = {
  qbr: { color: "var(--iw-purple)", label: "QBR" },
  standup: { color: "var(--iw-blue)", label: "Standup" },
  renewal: { color: "var(--iw-warning)", label: "Renewal" },
  meeting: { color: "var(--iw-success)", label: "Meeting" },
  milestone: { color: "var(--iw-danger)", label: "Milestone" },
  webinar: { color: "var(--iw-pink)", label: "Webinar" },
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const currentWeekDates = ["Feb 9", "Feb 10", "Feb 11", "Feb 12", "Feb 13", "Feb 14", "Feb 15"];
const currentWeekISO = ["2026-02-09", "2026-02-10", "2026-02-11", "2026-02-12", "2026-02-13", "2026-02-14", "2026-02-15"];

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState("2026-02-09");
  const [typeFilter, setTypeFilter] = useState("all");

  const dayEvents = events.filter((e) => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    return e.date === selectedDate;
  });

  const upcomingEvents = events.filter((e) => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    return true;
  }).slice(0, 8);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Calendar</h2>
          <p className="text-sm text-muted-foreground mt-1">Unified APAC calendar aggregating all connected systems</p>
        </div>
        <div className="flex gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
            <option value="all">All Events</option>
            {Object.entries(typeConfig).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
            <Plus className="w-4 h-4" /> New Event
          </button>
        </div>
      </div>

      {/* Week Strip */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <button className="p-1.5 rounded-md hover:bg-secondary transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm" style={{ fontWeight: 600 }}>February 9 - 15, 2026</span>
          <button className="p-1.5 rounded-md hover:bg-secondary transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const date = currentWeekISO[i];
            const dayEvts = events.filter((e) => e.date === date);
            const isToday = date === "2026-02-09";
            const isSelected = date === selectedDate;
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(date)}
                className={`p-2 rounded-lg text-center transition-all ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/10" : "hover:bg-secondary"}`}
              >
                <div className="text-[10px] text-muted-foreground mb-0.5" style={isSelected ? { color: "inherit" } : undefined}>{day}</div>
                <div className="text-sm" style={{ fontWeight: 600 }}>{currentWeekDates[i].split(" ")[1]}</div>
                {dayEvts.length > 0 && (
                  <div className="flex gap-0.5 justify-center mt-1">
                    {dayEvts.slice(0, 3).map((evt) => (
                      <div key={evt.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? "white" : typeConfig[evt.type].color }} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Day View */}
        <div className="lg:col-span-2">
          <div className="text-sm mb-3" style={{ fontWeight: 600 }}>
            {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            <span className="text-xs text-muted-foreground ml-2">{dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-3">
            {dayEvents.length > 0 ? dayEvents.map((evt) => {
              const cfg = typeConfig[evt.type];
              return (
                <div key={evt.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-12 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: cfg.color }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm" style={{ fontWeight: 600 }}>{evt.title}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {evt.time} ({evt.duration})</span>
                        {evt.location && <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {evt.location}</span>}
                        {evt.attendees > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {evt.attendees}</span>}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary font-mono">{evt.source}</span>
                      </div>
                      {evt.account && <div className="text-[11px] text-primary mt-1">{evt.account}</div>}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="bg-card border border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
                No events scheduled for this day
              </div>
            )}
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <div className="text-sm mb-3" style={{ fontWeight: 600 }}>Upcoming Events</div>
          <div className="space-y-2">
            {upcomingEvents.map((evt) => {
              const cfg = typeConfig[evt.type];
              return (
                <div key={evt.id} className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedDate(evt.date)}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-xs" style={{ fontWeight: 500 }}>{evt.title}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground pl-4">
                    {new Date(evt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {evt.time}
                    {evt.account && <span className="text-primary ml-1">· {evt.account}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
