"use client";

import * as React from "react";

import { DataTable, type DataTableColumn } from "@/components/l1/admin/data-table";
import { DetailDrawer } from "@/components/l1/admin/detail-drawer";
import { AdminEditFlow } from "@/components/l1/admin/edit-flow";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminApi } from "@/components/l1/admin/use-admin-api";

type UsersResponse = {
  users: Array<{ id: string; name: string; email: string; role: string; status: string }>;
  total: number;
};

type RolesResponse = {
  roles: Array<{ id: string; name: string; permissions: string[] }>;
};

export function IamPage() {
  const {
    data: usersRes,
    loading: usersLoading,
    error: usersError,
  } = useAdminApi<UsersResponse>("/api/admin/users");
  const {
    data: rolesRes,
    loading: rolesLoading,
    error: rolesError,
  } = useAdminApi<RolesResponse>("/api/admin/roles");

  const users = usersRes?.users ?? [];
  const roles = rolesRes?.roles ?? [];

  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [selectedRole, setSelectedRole] = React.useState<any>(null);

  const userCols: Array<DataTableColumn<any>> = [
    { key: "name", header: "Member", render: (u) => <div className="font-medium">{u.name}</div> },
    { key: "email", header: "Email" },
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
      render: (u) => <Badge variant="secondary">{u.status}</Badge>,
    },
  ];

  const roleCols: Array<DataTableColumn<any>> = [
    { key: "name", header: "Role", render: (r) => <div className="font-medium">{r.name}</div> },
    { key: "id", header: "Key", className: "w-[160px]" },
    {
      key: "permissions",
      header: "Permissions",
      render: (r) => <span className="text-xs text-slate-600">{r.permissions.join(", ")}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">Identity & Access (IAM)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Roles, permissions, assignments, and preview-as (Phase 3).
        </p>
      </div>

      {usersError || rolesError ? (
        <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 p-4 text-iw-red/90 text-sm">
          {usersError ?? rolesError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Members</p>
          <p className="text-lg font-semibold mt-2">{usersLoading ? "…" : users.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Roles</p>
          <p className="text-lg font-semibold mt-2">{rolesLoading ? "…" : roles.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Access reviews</p>
          <p className="text-sm text-slate-600 mt-2">Quarterly reviews & break-glass in Phase 3.</p>
        </Card>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <DataTable
            title="Members"
            rows={users}
            columns={userCols}
            onRowClick={(row) => setSelectedUser(row)}
          />
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <DataTable
            title="Roles"
            rows={roles}
            columns={roleCols}
            onRowClick={(row) => setSelectedRole(row)}
          />
        </TabsContent>
      </Tabs>

      <DetailDrawer
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
        title={selectedUser ? selectedUser.name : "Member"}
        description={selectedUser ? selectedUser.email : undefined}
      >
        {selectedUser ? (
          <AdminEditFlow
            title="Edit member (mock)"
            initial={selectedUser}
            onSave={async (next, justification) => {
              const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  operation: "update",
                  before: selectedUser,
                  after: next,
                  justification,
                }),
              });
              const json = await res.json();
              if (!res.ok) return { ok: false, error: "Save failed" };
              return { ok: true, saved: json.user ?? next, auditId: json.auditId };
            }}
          />
        ) : null}
      </DetailDrawer>

      <DetailDrawer
        open={!!selectedRole}
        onOpenChange={(open) => {
          if (!open) setSelectedRole(null);
        }}
        title={selectedRole ? selectedRole.name : "Role"}
        description={selectedRole ? selectedRole.id : undefined}
      >
        {selectedRole ? (
          <AdminEditFlow
            title="Edit role (mock)"
            initial={selectedRole}
            onSave={async (next, justification) => {
              const res = await fetch("/api/admin/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  operation: "update",
                  before: selectedRole,
                  after: next,
                  justification,
                }),
              });
              const json = await res.json();
              if (!res.ok) return { ok: false, error: "Save failed" };
              return { ok: true, saved: json.role ?? next, auditId: json.auditId };
            }}
          />
        ) : null}
      </DetailDrawer>
    </div>
  );
}
