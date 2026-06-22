/**
 * Domain Module Views
 *
 * V-O-E: Visualize → Obtain → Execute — on every surface, from one surface.
 *
 * No mock data. Empty states explain what connects here and why.
 * When connectors are wired, data hydrates into the same layout.
 */

import { useState } from "react";
import {
  Video, CheckCircle2, Users, AlertTriangle, TrendingUp,
  Plus, ChevronRight, ChevronDown, ArrowRight, Star,
  MessageSquare, Check, X, Edit3, Trash2, Brain,
  Calendar, Folder, Mail, RefreshCw, Plug,
} from "lucide-react";
import { type CTXEnum } from "../spine/types";
import { EntityTwinPanel } from "../twin-ui/entity-twin-panel";

// ─── Shared primitives ────────────────────────────────────────────────────────

function ViewHeader({ title, subtitle, action }: {
  title: string;
  subtitle: string;
  action?: { label: string; onClick?: () => void };
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-lg mb-0.5" style={{ fontWeight: 700, color: "var(--foreground)" }}>{title}</h1>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{subtitle}</p>
      </div>
      {action && (
        <button onClick={action.onClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white shrink-0"
          style={{ background: "var(--iw-blue)", fontWeight: 700 }}>
          <Plus className="w-3.5 h-3.5" /> {action.label}
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, message, connector }: {
  icon: React.ElementType;
  title: string;
  message: string;
  connector?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--secondary)" }}>
        <Icon className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />
      </div>
      <p className="text-sm mb-1.5" style={{ fontWeight: 600, color: "var(--foreground)" }}>{title}</p>
      <p className="text-xs mb-4 max-w-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{message}</p>
      {connector && (
        <div className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
          style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
          <Plug className="w-3 h-3" />
          Connect {connector} in Ingress to unlock this surface
        </div>
      )}
    </div>
  );
}

// Quick action row — shared across entity detail panels
function QuickActionRow({ onClose }: { onClose?: () => void }) {
  const [mode, setMode] = useState<"none" | "note" | "task">("none");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setText(""); setMode("none");
  };

  return (
    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
      {mode === "none" && (
        <div className="flex items-center gap-2">
          <button onClick={() => setMode("note")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px]"
            style={{ background: "var(--secondary)", color: "var(--foreground)", fontWeight: 600 }}>
            <Edit3 className="w-3 h-3" /> Log note
          </button>
          <button onClick={() => setMode("task")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px]"
            style={{ background: "var(--secondary)", color: "var(--foreground)", fontWeight: 600 }}>
            <CheckCircle2 className="w-3 h-3" /> Create task
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] text-white"
            style={{ background: "var(--iw-purple)", fontWeight: 600 }}>
            <Brain className="w-3 h-3" /> Assign to Twin
          </button>
          {onClose && (
            <button onClick={onClose} className="ml-auto" style={{ color: "var(--muted-foreground)" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      {mode !== "none" && (
        <div className="space-y-2">
          {mode === "note" ? (
            <textarea autoFocus value={text} onChange={e => setText(e.target.value)}
              placeholder="What happened? What's the plan?"
              className="w-full rounded-lg px-3 py-2 text-xs resize-none"
              rows={3}
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }} />
          ) : (
            <input autoFocus value={text} onChange={e => setText(e.target.value)}
              placeholder="Task description..."
              className="w-full rounded-lg px-3 py-2 text-xs"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }} />
          )}
          <div className="flex gap-2">
            <button onClick={save} className="px-3 py-1.5 rounded-lg text-[10px] text-white"
              style={{ background: "var(--iw-blue)", fontWeight: 700 }}>
              Save
            </button>
            <button onClick={() => { setMode("none"); setText(""); }}
              className="px-3 py-1.5 rounded-lg text-[10px]"
              style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {saved && (
        <p className="text-[10px]" style={{ color: "var(--iw-success)", fontWeight: 600 }}>
          ✓ Saved and committed to Spine.
        </p>
      )}
    </div>
  );
}

// ─── Meetings View ────────────────────────────────────────────────────────────

export function MeetingsView({ activeCtx }: { activeCtx?: CTXEnum }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <ViewHeader
        title="Meetings"
        subtitle="Prepare, run, and close the loop on every session"
        action={{ label: "Schedule" }}
      />

      {/* Surface structure — hydrates when calendar connector is active */}
      <div className="space-y-3 mb-6">
        <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
          Upcoming
        </p>

        {/* Empty state */}
        <EmptyState
          icon={Video}
          title="No upcoming meetings"
          message="Connect your calendar to see upcoming sessions with prep checklists, attendee context, and Twin's read on each meeting."
          connector="Google Calendar or Outlook"
        />
      </div>

      <div className="space-y-3">
        <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
          Recent
        </p>
        <div className="rounded-xl p-4 text-center"
          style={{ background: "var(--card)", border: "1px dashed var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Completed meetings and their logged outcomes will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Notes View ───────────────────────────────────────────────────────────────

type Note = { id: string; title: string; content: string; tags: string[]; date: string; pinned: boolean };

export function NotesView({ activeCtx }: { activeCtx?: CTXEnum }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [creating, setCreating] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<Record<string, string>>({});

  const createNote = () => {
    if (!newNote.title.trim()) return;
    const id = `n${Date.now()}`;
    setNotes(ns => [{ id, title: newNote.title, content: newNote.content, tags: [], date: "Just now", pinned: false }, ...ns]);
    setNewNote({ title: "", content: "" });
    setCreating(false);
  };

  const saveEdit = (id: string) => {
    setNotes(ns => ns.map(n => n.id === id ? { ...n, content: editContent[id] ?? n.content } : n));
    setEditing(null);
  };

  const togglePin = (id: string) => setNotes(ns => ns.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  const deleteNote = (id: string) => setNotes(ns => ns.filter(n => n.id !== id));

  const pinned = notes.filter(n => n.pinned);
  const unpinned = notes.filter(n => !n.pinned);

  return (
    <div className="h-full overflow-y-auto p-6">
      <ViewHeader
        title="Notes"
        subtitle="Working notes, decisions, patterns — yours to keep"
        action={{ label: "New Note", onClick: () => setCreating(true) }}
      />

      {creating && (
        <div className="rounded-xl p-4 mb-4 space-y-2"
          style={{ background: "var(--card)", border: "1px solid var(--iw-blue)" }}>
          <input autoFocus value={newNote.title}
            onChange={e => setNewNote(n => ({ ...n, title: e.target.value }))}
            placeholder="Note title..."
            className="w-full text-sm font-semibold bg-transparent outline-none"
            style={{ color: "var(--foreground)" }} />
          <textarea value={newNote.content}
            onChange={e => setNewNote(n => ({ ...n, content: e.target.value }))}
            placeholder="Write your note..."
            className="w-full text-xs resize-none bg-transparent outline-none"
            rows={3}
            style={{ color: "var(--foreground)" }} />
          <div className="flex gap-2">
            <button onClick={createNote} className="px-3 py-1.5 rounded-lg text-[10px] text-white"
              style={{ background: "var(--iw-blue)", fontWeight: 700 }}>Save note</button>
            <button onClick={() => { setCreating(false); setNewNote({ title: "", content: "" }); }}
              className="px-3 py-1.5 rounded-lg text-[10px]"
              style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>Cancel</button>
          </div>
        </div>
      )}

      {notes.length === 0 && !creating && (
        <EmptyState
          icon={Edit3}
          title="No notes yet"
          message="Notes are yours — no connector needed. Add working notes, decisions, and patterns that stay with you regardless of what tools you use."
        />
      )}

      {pinned.length > 0 && (
        <>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Pinned</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {pinned.map(note => (
              <NoteCard key={note.id} note={note}
                editing={editing} editContent={editContent}
                onEdit={() => { setEditing(note.id); setEditContent(c => ({ ...c, [note.id]: note.content })); }}
                onSave={() => saveEdit(note.id)}
                onCancel={() => setEditing(null)}
                onEditContent={v => setEditContent(c => ({ ...c, [note.id]: v }))}
                onPin={() => togglePin(note.id)}
                onDelete={() => deleteNote(note.id)} />
            ))}
          </div>
        </>
      )}

      {unpinned.length > 0 && (
        <>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Notes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unpinned.map(note => (
              <NoteCard key={note.id} note={note}
                editing={editing} editContent={editContent}
                onEdit={() => { setEditing(note.id); setEditContent(c => ({ ...c, [note.id]: note.content })); }}
                onSave={() => saveEdit(note.id)}
                onCancel={() => setEditing(null)}
                onEditContent={v => setEditContent(c => ({ ...c, [note.id]: v }))}
                onPin={() => togglePin(note.id)}
                onDelete={() => deleteNote(note.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NoteCard({ note, editing, editContent, onEdit, onSave, onCancel, onEditContent, onPin, onDelete }: any) {
  const isEditing = editing === note.id;
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm" style={{ fontWeight: 600, color: "var(--foreground)" }}>{note.title}</p>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onPin}>
            <Star className="w-3.5 h-3.5" style={{ color: note.pinned ? "var(--iw-warning)" : "var(--muted-foreground)" }} />
          </button>
          {!isEditing && <button onClick={onEdit}><Edit3 className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} /></button>}
          <button onClick={onDelete}><Trash2 className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} /></button>
        </div>
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <textarea autoFocus value={editContent[note.id] ?? note.content}
            onChange={e => onEditContent(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-xs resize-none"
            rows={5}
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }} />
          <div className="flex gap-2">
            <button onClick={onSave} className="px-2.5 py-1 rounded-lg text-[10px] text-white"
              style={{ background: "var(--iw-blue)", fontWeight: 700 }}>Save</button>
            <button onClick={onCancel} className="px-2.5 py-1 rounded-lg text-[10px]"
              style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <p className="text-[11px] leading-relaxed mb-3 line-clamp-4" style={{ color: "var(--muted-foreground)" }}>
          {note.content}
        </p>
      )}
      <div className="flex items-center gap-2 justify-between mt-2">
        <div className="flex gap-1 flex-wrap">
          {note.tags.map((tag: string) => (
            <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded font-mono"
              style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>{tag}</span>
          ))}
        </div>
        <span className="text-[9px] shrink-0" style={{ color: "var(--muted-foreground)" }}>{note.date}</span>
      </div>
    </div>
  );
}

// ─── Team View ────────────────────────────────────────────────────────────────

export function TeamView({ activeCtx }: { activeCtx?: CTXEnum }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <ViewHeader title="Team" subtitle="Your people — workload, coverage, what needs attention" />
      <EmptyState
        icon={Users}
        title="No team data"
        message="Connect your CRM or HR tools to see your team's workload, account coverage, and where capacity needs rebalancing."
        connector="Salesforce, HubSpot, or BambooHR"
      />
    </div>
  );
}

// ─── Risks View ───────────────────────────────────────────────────────────────

export function RisksView({ activeCtx }: { activeCtx?: CTXEnum }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <ViewHeader title="At-Risk" subtitle="Accounts with signals that need action now" />

      {/* Surface structure preview */}
      <div className="space-y-2">
        {/* Column header */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl"
          style={{ background: "var(--secondary)" }}>
          <div className="w-8 text-[9px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Score</div>
          <div className="flex-1 text-[9px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Account</div>
          <div className="text-[9px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Type</div>
          <div className="text-[9px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>ARR</div>
          <div className="text-[9px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Renewal</div>
        </div>

        <EmptyState
          icon={AlertTriangle}
          title="No at-risk accounts detected"
          message="Connect your CRM and support tools to surface accounts with renewal risk signals — champion silence, open tickets, usage drops, billing issues."
          connector="Salesforce + Zendesk"
        />
      </div>
    </div>
  );
}

// ─── Expansion View ───────────────────────────────────────────────────────────

export function ExpansionView({ activeCtx }: { activeCtx?: CTXEnum }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <ViewHeader title="Expansion" subtitle="Accounts showing signals to grow — act before the window closes" />

      {/* Surface structure preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl"
          style={{ background: "var(--secondary)" }}>
          <div className="flex-1 text-[9px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Account</div>
          <div className="text-[9px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Signal</div>
          <div className="text-[9px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>ARR Potential</div>
          <div className="text-[9px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Window</div>
        </div>

        <EmptyState
          icon={TrendingUp}
          title="No expansion signals yet"
          message="Connect your product analytics and CRM to surface accounts with usage surges, NPS spikes, new team adoption, or expansion asks in call notes."
          connector="Salesforce + Product Analytics"
        />
      </div>
    </div>
  );
}

// ─── Projects View ────────────────────────────────────────────────────────────

type Task = { id: string; text: string; done: boolean; assignee: string };
type Project = { id: string; name: string; status: string; owner: string; progress: number; deadline: string; context: string; tasks: Task[] };

export function ProjectsView({ activeCtx }: { activeCtx?: CTXEnum }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [addingTask, setAddingTask] = useState<string | null>(null);
  const [newTaskMap, setNewTaskMap] = useState<Record<string, string>>({});

  const createProject = () => {
    if (!newProjectName.trim()) return;
    const id = `p${Date.now()}`;
    setProjects(ps => [...ps, { id, name: newProjectName, status: "planning", owner: "You", progress: 0, deadline: "—", context: "", tasks: [] }]);
    setNewProjectName("");
    setCreating(false);
  };

  const toggleTask = (projectId: string, taskId: string) => {
    setProjects(ps => ps.map(p =>
      p.id === projectId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) } : p
    ));
  };

  const addTask = (projectId: string) => {
    const text = newTaskMap[projectId]?.trim();
    if (!text) return;
    const id = `t${Date.now()}`;
    setProjects(ps => ps.map(p =>
      p.id === projectId ? { ...p, tasks: [...p.tasks, { id, text, done: false, assignee: "You" }] } : p
    ));
    setNewTaskMap(m => ({ ...m, [projectId]: "" }));
    setAddingTask(null);
  };

  const statusStyle = (s: string) => s === "active"
    ? { color: "var(--iw-success)", bg: "var(--iw-success-light)" }
    : s === "stalled"
    ? { color: "var(--iw-danger)", bg: "var(--iw-danger-light)" }
    : { color: "var(--iw-blue)", bg: "var(--iw-blue-50)" };

  return (
    <div className="h-full overflow-y-auto p-6">
      <ViewHeader
        title="Initiatives"
        subtitle="Active projects and cross-functional work"
        action={{ label: "New Project", onClick: () => setCreating(true) }}
      />

      {creating && (
        <div className="rounded-xl p-4 mb-4 space-y-2"
          style={{ background: "var(--card)", border: "1px solid var(--iw-blue)" }}>
          <input autoFocus value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createProject(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Project name..."
            className="w-full text-sm bg-transparent outline-none"
            style={{ color: "var(--foreground)", fontWeight: 600 }} />
          <div className="flex gap-2">
            <button onClick={createProject} className="px-3 py-1.5 rounded-lg text-[10px] text-white"
              style={{ background: "var(--iw-blue)", fontWeight: 700 }}>Create</button>
            <button onClick={() => setCreating(false)} className="px-3 py-1.5 rounded-lg text-[10px]"
              style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>Cancel</button>
          </div>
        </div>
      )}

      {projects.length === 0 && !creating && (
        <EmptyState
          icon={Folder}
          title="No active projects"
          message="Create a project to track cross-functional work, assign tasks to your team or Twin, and see progress in one place. Connect Jira or Linear to sync existing projects."
          connector="Jira or Linear"
        />
      )}

      <div className="space-y-3">
        {projects.map(p => {
          const st = statusStyle(p.status);
          const doneTasks = p.tasks.filter(t => t.done).length;
          return (
            <div key={p.id} className="rounded-xl overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <button className="flex items-start gap-3 p-4 w-full text-left"
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: st.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>{p.name}</p>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold capitalize"
                      style={{ background: st.bg, color: st.color }}>{p.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                    <span>{doneTasks}/{p.tasks.length} tasks</span>
                    <span>·</span>
                    <span>Owner: {p.owner}</span>
                  </div>
                </div>
                {expanded === p.id
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />}
              </button>

              {expanded === p.id && (
                <div className="px-4 pb-4 border-t space-y-1.5" style={{ borderColor: "var(--border)" }}>
                  <p className="text-[9px] uppercase tracking-widest pt-3 mb-2"
                    style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Tasks</p>

                  {p.tasks.map(task => (
                    <button key={task.id} onClick={() => toggleTask(p.id, task.id)}
                      className="flex items-center gap-2.5 w-full text-left py-1">
                      <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                        style={{ borderColor: task.done ? "var(--iw-success)" : "var(--border)", background: task.done ? "var(--iw-success)" : "transparent" }}>
                        {task.done && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-xs flex-1"
                        style={{ color: task.done ? "var(--muted-foreground)" : "var(--foreground)", textDecoration: task.done ? "line-through" : "none" }}>
                        {task.text}
                      </span>
                    </button>
                  ))}

                  {addingTask === p.id ? (
                    <div className="flex gap-2 pt-1">
                      <input autoFocus value={newTaskMap[p.id] || ""}
                        onChange={e => setNewTaskMap(m => ({ ...m, [p.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") addTask(p.id); if (e.key === "Escape") setAddingTask(null); }}
                        placeholder="New task..."
                        className="flex-1 rounded-lg px-2.5 py-1.5 text-xs"
                        style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }} />
                      <button onClick={() => addTask(p.id)} className="px-2.5 py-1 rounded-lg text-[10px] text-white"
                        style={{ background: "var(--iw-blue)", fontWeight: 700 }}>Add</button>
                      <button onClick={() => setAddingTask(null)} style={{ color: "var(--muted-foreground)" }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingTask(p.id)}
                      className="flex items-center gap-1.5 text-[10px] pt-1"
                      style={{ color: "var(--iw-blue)", fontWeight: 600 }}>
                      <Plus className="w-3 h-3" /> Add task
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
