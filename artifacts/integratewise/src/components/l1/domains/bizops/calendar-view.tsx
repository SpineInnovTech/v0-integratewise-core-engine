/**
 * BizOps — Calendar View
 * Unified calendar aggregating all connected systems.
 * Data: Spine projection via useHydrateProjection("bizops") — calendar_event entities.
 */
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, Video, Users, Loader2 } from "lucide-react";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";

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

const typeConfig: Record<string, { color: string; label: string }> = {
  qbr: { color: "var(--iw-purple)", label: "QBR" },
  standup: { color: "var(--iw-blue)", label: "Standup" },
  renewal: { color: "var(--iw-warning)", label: "Renewal" },
  meeting: { color: "var(--iw-success)", label: "Meeting" },
  milestone: { color: "var(--iw-danger)", label: "Milestone" },
  webinar: { color: "var(--iw-pink)", label: "Webinar" },
};

/** Compute the Monday-Sunday week containing a given date */
function getWeekForDate(d: Date): { weekDates: string[]; weekLabels: string[]; weekISO: string[] } {
  const day = d.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekISO: string[] = [];
  const weekLabels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const wd = new Date(monday);
    wd.setDate(monday.getDate() + i);
    weekISO.push(wd.toISOString().slice(0, 10));
    weekLabels.push(
      wd.toLocaleDateString("en-US", { month: "short", day: "numeric" }).replace(",", "")
    );
  }

  return { weekDates: weekDays, weekLabels, weekISO };
}

function formatWeekHeader(weekISO: string[]): string {
  if (weekISO.length < 7) return "";
  const start = new Date(weekISO[0]);
  const end = new Date(weekISO[6]);
  const startStr = start.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const endStr =
    start.getMonth() === end.getMonth()
      ? end.toLocaleDateString("en-US", { day: "numeric", year: "numeric" })
      : end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `${startStr} - ${endStr}`;
}

export function CalendarView() {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: raw, isLoading: loading } = useWorkspaceEntities("calendar_event");

  const events: CalendarEvent[] = useMemo(() => {
    if (!raw || raw.length === 0) return [];
    return raw.map((r: any) => ({
      id: r.id || crypto.randomUUID(),
      title: r.title || r.name || "Untitled event",
      date: (r.date || r.start_date || "").slice(0, 10),
      time: r.time || r.start_time || "",
      duration: r.duration || "",
      type: r.type || "meeting",
      source: r.source || "",
      attendees: typeof r.attendees === "number" ? r.attendees : 0,
      account: r.account || r.account_name || undefined,
      location: r.location || undefined,
    }));
  }, [raw]);

  const week = useMemo(() => getWeekForDate(new Date(selectedDate)), [selectedDate]);

  const dayEvents = events.filter((e) => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    return e.date === selectedDate;
  });

  const upcomingEvents = events
    .filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      return true;
    })
    .slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading calendar...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Calendar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Unified APAC calendar aggregating all connected systems
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer"
          >
            <option value="all">All Events</option>
            {Object.entries(typeConfig).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
            <Plus className="w-4 h-4" /> New Event
          </button>
        </div>
      </div>

      {/* Week Strip */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 7);
              setSelectedDate(d.toISOString().slice(0, 10));
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm" style={{ fontWeight: 600 }}>
            {formatWeekHeader(week.weekISO)}
          </span>
          <button
            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 7);
              setSelectedDate(d.toISOString().slice(0, 10));
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {week.weekDates.map((day, i) => {
            const date = week.weekISO[i];
            const dayEvts = events.filter((e) => e.date === date);
            const isToday = date === todayStr;
            const isSelected = date === selectedDate;
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(date)}
                className={`p-2 rounded-lg text-center transition-all ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/10" : "hover:bg-secondary"}`}
              >
                <div
                  className="text-[10px] text-muted-foreground mb-0.5"
                  style={isSelected ? { color: "inherit" } : undefined}
                >
                  {day}
                </div>
                <div className="text-sm" style={{ fontWeight: 600 }}>
                  {week.weekLabels[i].split(" ")[1]}
                </div>
                {dayEvts.length > 0 && (
                  <div className="flex gap-0.5 justify-center mt-1">
                    {dayEvts.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: isSelected
                            ? "white"
                            : typeConfig[evt.type]?.color || "var(--iw-blue)",
                        }}
                      />
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
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            <span className="text-xs text-muted-foreground ml-2">
              {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-3">
            {dayEvents.length > 0 ? (
              dayEvents.map((evt) => {
                const cfg = typeConfig[evt.type] || typeConfig.meeting;
                return (
                  <div
                    key={evt.id}
                    className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-1 h-12 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm" style={{ fontWeight: 600 }}>
                            {evt.title}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${cfg.color}15`,
                              color: cfg.color,
                              fontWeight: 500,
                            }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {evt.time} ({evt.duration})
                          </span>
                          {evt.location && (
                            <span className="flex items-center gap-1">
                              <Video className="w-3 h-3" /> {evt.location}
                            </span>
                          )}
                          {evt.attendees > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {evt.attendees}
                            </span>
                          )}
                          {evt.source && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary font-mono">
                              {evt.source}
                            </span>
                          )}
                        </div>
                        {evt.account && (
                          <div className="text-[11px] text-primary mt-1">{evt.account}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-card border border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
                No events scheduled for this day
              </div>
            )}
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <div className="text-sm mb-3" style={{ fontWeight: 600 }}>
            Upcoming Events
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
              No upcoming events
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((evt) => {
                const cfg = typeConfig[evt.type] || typeConfig.meeting;
                return (
                  <div
                    key={evt.id}
                    className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setSelectedDate(evt.date)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="text-xs" style={{ fontWeight: 500 }}>
                        {evt.title}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground pl-4">
                      {new Date(evt.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {evt.time}
                      {evt.account && <span className="text-primary ml-1">· {evt.account}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarView;
