/**
 * Account Team View — From Project Task Organizer
 * Internal + Client team with engagement, champions, and contact info.
 */
import { useMemo } from "react";
import { Users, Mail, Phone, Star, UserX, UserCheck, MessageSquare, Loader2 } from "lucide-react";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";
import { type PeopleTeam } from "../csm-intelligence-data";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  title: string;
  company: "Internal" | "Client";
  email: string;
  phone?: string;
  initials: string;
  status: "active" | "champion" | "departed";
  engagement: "high" | "medium" | "low";
  lastContact: string;
  keyResponsibilities: string[];
  notes?: string;
  color: string;
}

function deriveTeamMembers(people: PeopleTeam[]): TeamMember[] {
  const colors = [
    "var(--iw-signal-info)",
    "var(--iw-signal-success)",
    "#b8943f",
    "var(--iw-signal-warning)",
    "#3d7a50",
  ];
  return people.map((p, i) => ({
    id: p.personId,
    name: p.fullName,
    role: p.role,
    title: p.role,
    company: "Internal" as const,
    email: p.email,
    initials: p.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2),
    status: p.activeStatus === "Active" ? ("active" as const) : ("departed" as const),
    engagement:
      p.accountCount > 5
        ? ("high" as const)
        : p.accountCount > 2
          ? ("medium" as const)
          : ("low" as const),
    lastContact: "Active",
    keyResponsibilities: [p.department, p.region].filter(Boolean),
    color: colors[i % colors.length],
  }));
}

const engagementConfig = {
  high: { color: "var(--iw-signal-success)", dots: 3 },
  medium: { color: "var(--iw-signal-warning)", dots: 2 },
  low: { color: "var(--iw-signal-critical)", dots: 1 },
};

const statusConfig = {
  active: {
    color: "var(--iw-signal-success)",
    bg: "rgba(16, 185, 129, 0.15)",
    label: "Active",
    icon: <UserCheck size={10} />,
  },
  champion: {
    color: "var(--iw-signal-warning)",
    bg: "rgba(245, 158, 11, 0.15)",
    label: "Champion",
    icon: <Star size={10} />,
  },
  departed: {
    color: "#8A8580",
    bg: "rgba(158, 158, 158, 0.15)",
    label: "Departed",
    icon: <UserX size={10} />,
  },
};

export function AccountTeamView() {
  const { data: peopleData, isLoading, error } = useWorkspaceEntities<PeopleTeam>("people_team");
  const teamMembers = useMemo(() => deriveTeamMembers(peopleData), [peopleData]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading team...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-64 text-iw-red">
        Failed to load team data: {error}
      </div>
    );
  if (teamMembers.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Users className="w-8 h-8 mb-2" />
        <p className="text-lg font-medium">No team members yet</p>
        <p className="text-sm">Connect your HR or CRM data to see team assignments here.</p>
      </div>
    );

  const internalTeam = teamMembers.filter((m) => m.company === "Internal");
  const clientTeam = teamMembers.filter((m) => m.company === "Client");
  const champions = teamMembers.filter((m) => m.status === "champion");

  const renderMemberCard = (member: TeamMember) => {
    const engagement = engagementConfig[member.engagement];
    const status = statusConfig[member.status];

    return (
      <div
        key={member.id}
        className={`rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md hover:border-[var(--iw-signal-info)]/30 ${
          member.status === "departed" ? "opacity-60" : ""
        }`}
        style={{ borderColor: "var(--border)" }}
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs shrink-0 font-bold"
              style={{ backgroundColor: member.color }}
            >
              {member.initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground">{member.name}</h3>
                <span
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] uppercase font-semibold"
                  style={{ backgroundColor: status.bg, color: status.color }}
                >
                  {status.icon} {status.label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{member.title}</div>

              {member.status !== "departed" && (
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] text-muted-foreground">Engagement:</span>
                  <div className="flex items-center gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: i < engagement.dots ? engagement.color : "var(--border)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {member.notes && (
                <div
                  className="rounded-lg px-3 py-1.5 mb-3"
                  style={{ backgroundColor: "rgba(245, 158, 11, 0.15)" }}
                >
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: "var(--iw-signal-warning)" }}
                  >
                    {member.notes}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-1 mb-3">
                {member.keyResponsibilities.map((resp, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] text-muted-foreground bg-muted/50"
                  >
                    {resp}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail size={11} /> {member.email}
                </span>
                {member.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={11} /> {member.phone}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">
                  Last contact: {member.lastContact}
                </span>
                {member.status !== "departed" && (
                  <button
                    className="text-[10px] font-semibold flex items-center gap-0.5 hover:underline"
                    style={{ color: "var(--iw-signal-info)" }}
                  >
                    <MessageSquare size={10} /> Contact
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      {/* Hero */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--iw-signal-info) 0%, #2d5a3d 50%, #1a3a2a 100%)",
          boxShadow: "0 4px 20px rgba(61, 122, 80, 0.2)",
        }}
      >
        <div className="p-6 text-white">
          <div className="flex items-center gap-3 mb-6">
            <Users size={28} className="text-white/90" />
            <h1 className="text-2xl font-bold">Account Team</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15">
              <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">
                Total Team
              </div>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15">
              <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">
                Internal
              </div>
              <div className="text-2xl font-bold">{internalTeam.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15">
              <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Client</div>
              <div className="text-2xl font-bold">{clientTeam.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15">
              <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">
                Champions
              </div>
              <div className="text-2xl font-bold">{champions.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground px-1">IntegrateWise Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {internalTeam.map(renderMemberCard)}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground px-1">Client Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientTeam.map(renderMemberCard)}
        </div>
      </div>
    </div>
  );
}
