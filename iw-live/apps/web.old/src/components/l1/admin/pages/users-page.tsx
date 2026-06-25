"use client";

import * as React from "react";
import { Mail, UserPlus, Users } from "lucide-react";

import { AdminEditFlow } from "@/components/l1/admin/edit-flow";
import { DataTable, type DataTableColumn } from "@/components/l1/admin/data-table";
import { DetailDrawer } from "@/components/l1/admin/detail-drawer";
import { useAdminApi } from "@/components/l1/admin/use-admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "invited" | "suspended";
};

type UsersResponse = {
  users: AdminUser[];
  total: number;
};

type RolesResponse = {
  roles: Array<{ id: string; name: string; permissions: string[] }>;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "?";
  const last = (parts.length > 1 ? parts[parts.length - 1]?.[0] : "") ?? "";
  return (first + last).toUpperCase();
}

export function UsersAdminPage() {
  const { data: usersRes, loading, error, reload } = useAdminApi<UsersResponse>("/api/admin/users");
  const { data: rolesRes } = useAdminApi<RolesResponse>("/api/admin/roles");

  const users = usersRes?.users ?? [];
  const roles = rolesRes?.roles ?? [];

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteName, setInviteName] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<string>(roles[0]?.id ?? "role_manager");
  const [inviteLoading, setInviteLoading] = React.useState(false);

  React.useEffect(() => {
    if (!inviteRole && roles.length) setInviteRole(roles[0]!.id);
  }, [inviteRole, roles]);

  const [selected, setSelected] = React.useState<AdminUser | null>(null);

  const cols: Array<DataTableColumn<AdminUser>> = [
    {
      key: "name",
      header: "Member",
      render: (u) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-iw-slate-mid/10 text-iw-slate flex items-center justify-center text-xs font-bold shrink-0">
            {initials(u.name)}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{u.name}</div>
            <div className="text-xs text-slate-500 truncate">{u.email}</div>
          </div>
        </div>
      ),
      getValue: (u) => `${u.name} ${u.email}`,
    },
    {
      key: "role",
      header: "Role",
      className: "w-[140px]",
      render: (u) => <Badge variant="outline">{u.role}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      className: "w-[140px]",
      render: (u) => (
        <Badge
          variant={
            u.status === "active" ? "default" : u.status === "invited" ? "secondary" : "outline"
          }
        >
          {u.status}
        </Badge>
      ),
    },
  ];

  const activeCount = users.filter((u) => u.status === "active").length;
  const invitedCount = users.filter((u) => u.status === "invited").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
          <h1 className="text-2xl font-semibold">People</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage members, invites, roles, and access lifecycle (Slack-style).
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite people
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 p-4 text-iw-red/90 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Members</p>
          <p className="text-lg font-semibold mt-2">{loading ? "…" : users.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Active</p>
          <p className="text-lg font-semibold mt-2">{loading ? "…" : activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Invited</p>
          <p className="text-lg font-semibold mt-2">{loading ? "…" : invitedCount}</p>
        </Card>
      </div>

      <DataTable
        title="Members"
        rows={users}
        columns={cols}
        searchPlaceholder="Search name, email, role…"
        onRowClick={(row) => setSelected(row)}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected ? selected.name : "Member"}
        description={selected ? selected.email : undefined}
      >
        {selected ? (
          <div className="space-y-6">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Access</p>
              <div className="mt-2 grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
                    Role
                  </span>
                  <span className="text-sm text-slate-700">
                    <Badge variant="outline">{selected.role}</Badge>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
                    Status
                  </span>
                  <span className="text-sm text-slate-700">
                    <Badge variant="secondary">{selected.status}</Badge>
                  </span>
                </div>
              </div>
            </Card>

            <AdminEditFlow
              title="Edit member (mock)"
              initial={selected}
              onSave={async (next, justification) => {
                const res = await fetch("/api/admin/users", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    operation: "update",
                    before: selected,
                    after: next,
                    justification,
                  }),
                });
                const json = await res.json();
                if (!res.ok) return { ok: false, error: "Save failed" };
                reload();
                return { ok: true, saved: json.user ?? next, auditId: json.auditId };
              }}
            />
          </div>
        ) : null}
      </DetailDrawer>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite people</DialogTitle>
            <DialogDescription>
              Send a workspace invite. This is a UI-first mock that hits /api/admin/users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="inviteName">Name</Label>
              <Input
                id="inviteName"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inviteEmail">Email</Label>
              <Input
                id="inviteEmail"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jane@company.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {(roles.length
                    ? roles
                    : [{ id: "role_manager", name: "Manager", permissions: [] }]
                  ).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setInviteOpen(false)}
                disabled={inviteLoading}
              >
                Cancel
              </Button>
              <Button
                disabled={inviteLoading || !inviteEmail.trim()}
                onClick={async () => {
                  setInviteLoading(true);
                  try {
                    const res = await fetch("/api/admin/users", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: inviteName.trim() || inviteEmail.trim(),
                        email: inviteEmail.trim(),
                        role: inviteRole,
                        status: "invited",
                      }),
                    });
                    if (!res.ok) throw new Error(`Invite failed (${res.status})`);
                    toast.success("Invite sent", {
                      description: `Invitation sent to ${inviteEmail.trim()}.`,
                    });
                    setInviteOpen(false);
                    setInviteName("");
                    setInviteEmail("");
                    reload();
                  } catch (e: any) {
                    toast.error("Invite failed", {
                      description: e?.message ?? "Failed",
                    });
                  } finally {
                    setInviteLoading(false);
                  }
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send invite
              </Button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5 text-slate-500" />
              <p>
                For full provisioning, configure SSO/SCIM in{" "}
                <span className="font-semibold">Admin → Provisioning</span>.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
