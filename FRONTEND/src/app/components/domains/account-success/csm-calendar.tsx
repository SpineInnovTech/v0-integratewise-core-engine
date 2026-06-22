/**
 * Calendar View — Unified calendar aggregating meetings, renewals, milestones, tasks
 * CSM Intelligence L1 Workspace
 */
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, RefreshCw, Target, CheckSquare } from "lucide-react";
import { calendarEvents, type CalendarEvent } from "./csm-data";

type ViewMode = "month" | "week" | "agenda";

const typeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  meeting: { icon: <Calendar className="w-3 h-3" />, label: "Meeting" },
  renewal: { icon: <RefreshCw className="w-3 h-3" />, label: "Renewal" },
  milestone: { icon: <Target className="w-3 h-3" />, label: "Milestone" },
  "task-due": { icon: <CheckSquare className="w-3 h-3" />, label: "Task Due" },
};

export function CSMCalendarView() {
  const [mode, setMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 10)); // Feb 10, 2026
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredEvents = useMemo(() => {
    if (typeFilter === "all") return calendarEvents;
    return calendarEvents.filter(e => e.type === typeFilter);
  }, [typeFilter]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const navigate = (dir: number) => {
    if (mode === "month") setCurrentDate(new Date(year, month + dir, 1));
    else if (mode === "week") setCurrentDate(new Date(currentDate.getTime() + dir * 7 * 86400000));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronLeft className="w-4 h-4" /></button>
            <h2 className="text-lg min-w-[200px] text-center" style={{ fontWeight: 600 }}>
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => setCurrentDate(new Date(2026, 1, 10))} className="text-xs px-2 py-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground">Today</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {["all", "meeting", "renewal", "milestone", "task-due"].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)} className={`px-2.5 py-1 text-xs rounded-full transition-colors ${typeFilter === t ? "bg-[var(--iw-success)]/15 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground hover:text-foreground"}`} style={{ fontWeight: typeFilter === t ? 600 : 400 }}>
                  {t === "all" ? "All" : (typeConfig[t]?.label || t)}
                </button>
              ))}
            </div>
            <div className="flex items-center bg-secondary rounded-lg p-0.5">
              {(["month", "week", "agenda"] as ViewMode[]).map(m => (
                <button key={m} onClick={() => setMode(m)} className={`px-2.5 py-1 text-xs rounded-md transition-colors ${mode === m ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`} style={{ fontWeight: mode === m ? 600 : 400 }}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {mode === "month" && <MonthView year={year} month={month} events={filteredEvents} />}
        {mode === "week" && <WeekView currentDate={currentDate} events={filteredEvents} />}
        {mode === "agenda" && <AgendaView events={filteredEvents} />}
      </div>
    </div>
  );
}

function MonthView({ year, month, events }: { year: number; month: number; events: CalendarEvent[] }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = "2026-02-10";

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="text-center text-[10px] text-muted-foreground py-2" style={{ fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-t border-l border-border">
        {cells.map((day, i) => {
          const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
          const dayEvents = day ? events.filter(e => e.date === dateStr) : [];
          const isToday = dateStr === today;
          return (
            <div key={i} className={`min-h-[100px] border-r border-b border-border p-1.5 ${day ? "bg-card hover:bg-secondary/30" : "bg-secondary/20"} transition-colors`}>
              {day && (
                <>
                  <div className={`text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[var(--iw-success)] text-white" : "text-muted-foreground"}`} style={{ fontWeight: isToday ? 700 : 400 }}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id} className="text-[9px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80" style={{ backgroundColor: `${ev.color}20`, color: ev.color, fontWeight: 500 }}>
                        {ev.time && <span className="mr-0.5">{ev.time}</span>}
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 3} more</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, events }: { currentDate: Date; events: CalendarEvent[] }) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const today = "2026-02-10";

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7am to 6pm

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] min-w-[800px]">
        {/* Header */}
        <div className="border-b border-border" />
        {weekDays.map(d => {
          const dateStr = d.toISOString().split("T")[0];
          const isToday = dateStr === today;
          return (
            <div key={dateStr} className={`text-center border-b border-l border-border py-2 ${isToday ? "bg-[var(--iw-success)]/5" : ""}`}>
              <p className="text-[10px] text-muted-foreground">{d.toLocaleDateString("en-US", { weekday: "short" })}</p>
              <p className={`text-sm ${isToday ? "text-[var(--iw-success)]" : ""}`} style={{ fontWeight: isToday ? 700 : 500 }}>{d.getDate()}</p>
            </div>
          );
        })}
        {/* Time grid */}
        {hours.map(hour => (
          <div key={hour} className="contents">
            <div className="text-[10px] text-muted-foreground text-right pr-2 py-3 border-b border-border">
              {hour > 12 ? `${hour - 12}pm` : hour === 12 ? "12pm" : `${hour}am`}
            </div>
            {weekDays.map(d => {
              const dateStr = d.toISOString().split("T")[0];
              const hourEvents = events.filter(e => {
                if (e.date !== dateStr || !e.time) return false;
                const h = parseInt(e.time.split(":")[0]);
                return h === hour;
              });
              return (
                <div key={`${dateStr}-${hour}`} className="border-l border-b border-border p-0.5 min-h-[48px] relative">
                  {hourEvents.map(ev => (
                    <div key={ev.id} className="text-[9px] px-1.5 py-1 rounded mb-0.5 cursor-pointer hover:opacity-80" style={{ backgroundColor: `${ev.color}20`, color: ev.color, fontWeight: 500 }}>
                      <span className="mr-1">{ev.time}</span>
                      {ev.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function AgendaView({ events }: { events: CalendarEvent[] }) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
  const byDate: Record<string, CalendarEvent[]> = {};
  for (const e of sorted) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {Object.entries(byDate).map(([date, items]) => {
        const d = new Date(date);
        const isToday = date === "2026-02-10";
        return (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${isToday ? "bg-[var(--iw-success)]/15 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground"}`} style={{ fontWeight: 600 }}>
                {isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="space-y-2 ml-2 border-l-2 border-border pl-4">
              {items.map(ev => {
                const tc = typeConfig[ev.type];
                return (
                  <div key={ev.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-sm transition-all cursor-pointer">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${ev.color}15`, color: ev.color }}>
                      {tc?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ fontWeight: 500 }}>{ev.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {ev.time && <span>{ev.time}</span>}
                        {ev.duration && <span>· {ev.duration}min</span>}
                        {ev.accountName && <span>· {ev.accountName}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${ev.color}15`, color: ev.color, fontWeight: 500 }}>
                      {tc?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
