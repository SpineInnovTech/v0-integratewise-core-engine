"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/l1/admin/data-table";
import { DetailDrawer } from "@/components/l1/admin/detail-drawer";
import { useAdminApi } from "@/components/l1/admin/use-admin-api";
import { FeatureGate } from "@/components/billing/paywall/FeatureGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Users, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@/types/admin";

// Preset roles from architecture doc
const PRESET_ROLES = [
  {
    id: "owner",
    name: "Owner",
    description:
      "Full access to all features and settings. Can manage billing and delete the workspace.",
    permissions: ["all"],
    memberCount: 1,
    isSystem: true,
  },
  {
    id: "admin",
    name: "Admin",
    description:
      "Can manage users, integrations, and most settings. Cannot delete workspace or change billing.",
    permissions: ["users.manage", "integrations.manage", "settings.manage", "audit.view"],
    memberCount: 2,
    isSystem: true,
  },
  {
    id: "manager",
    name: "Manager",
    description:
      "Can view reports, approve actions, and manage their department. Cannot change global settings.",
    permissions: ["reports.view", "actions.approve", "department.manage"],
    memberCount: 5,
    isSystem: true,
  },
  {
    id: "practitioner",
    name: "Practitioner",
    description: "Standard user access. Can create and execute actions within their scope.",
    permissions: ["data.view", "actions.create", "actions.execute"],
    memberCount: 15,
    isSystem: true,
  },
  {
    id: "readonly",
    name: "Read Only",
    description: "View-only access. Cannot make any changes.",
    permissions: ["data.view"],
    memberCount: 3,
    isSystem: true,
  },
];

type CustomRole = {
  id: string;
  name: string;
  description: string;
  baseRole: string;
  memberCount: number;
  createdAt: string;
  permissions: Record<string, string[]>;
};

const PERMISSION_RESOURCES = [
  "today",
  "spine",
  "context",
  "knowledge",
  "actions",
  "audit",
  "admin",
];

const PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "execute", "approve", "admin"];

const WORLDS = ["personal", "work", "accounts"];

const DEPARTMENTS = [
  "Operations",
  "Sales",
  "Marketing",
  "Customer Success",
  "Finance",
  "Development",
  "Research",
  "Strategy",
  "Management",
  "People",
  "Legal",
  "Security",
];

import { useAdminRoles, AdminRole } from "@/hooks/useAdminRoles";

export function AdminRolesPage() {
  const { roles: customRoles, loading, error, createRole, updateRole, refresh } = useAdminRoles();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [selectedCustomRole, setSelectedCustomRole] = React.useState<CustomRole | null>(null);

  const [newRoleName, setNewRoleName] = React.useState("");
  const [newRoleDescription, setNewRoleDescription] = React.useState("");
  const [newRoleBaseRole, setNewRoleBaseRole] = React.useState("practitioner");
  const [newRolePermissions, setNewRolePermissions] = React.useState<Record<string, Set<string>>>(
    {}
  );
  const [newRoleWorlds, setNewRoleWorlds] = React.useState<Set<string>>(new Set(["personal"]));
  const [newRoleDepartments, setNewRoleDepartments] = React.useState<Set<string>>(new Set());

  const customRoleColumns: DataTableColumn<CustomRole>[] = [
    {
      key: "name",
      header: "Name",
      render: (r: CustomRole) => <span className="font-medium">{r.name}</span>,
    },
    {
      key: "baseRole",
      header: "Base Role",
      render: (r: CustomRole) => <Badge variant="outline">{r.baseRole}</Badge>,
    },
    { key: "memberCount", header: "Members", render: (r: CustomRole) => r.memberCount },
    { key: "createdAt", header: "Created", render: (r: CustomRole) => r.createdAt },
    {
      key: "actions",
      header: "",
      render: (r: CustomRole) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCustomRole(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-iw-red hover:text-iw-red">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreateRole = async () => {
    if (!newRoleName) {
      toast.error("Role name is required");
      return;
    }

    setIsCreating(true);
    try {
      await createRole({
        name: newRoleName,
        permissions: Object.entries(newRolePermissions).flatMap(([res, actions]) =>
          Array.from(actions).map((action) => `${res}.${action}`)
        ),
        // other fields like description can be added if backend supports
      });

      toast.success("Role created successfully");
      setIsCreateDialogOpen(false);
      // Reset form
      setNewRoleName("");
      setNewRoleDescription("");
      setNewRoleBaseRole("practitioner");
      setNewRolePermissions({});
      setNewRoleWorlds(new Set(["personal"]));
      setNewRoleDepartments(new Set());
      refresh();
    } catch (err) {
      toast.error("Failed to create role");
    } finally {
      setIsCreating(false);
    }
  };

  const togglePermission = (resource: string, action: string) => {
    setNewRolePermissions((prev) => {
      const next = { ...prev };
      if (!next[resource]) next[resource] = new Set();
      else next[resource] = new Set(next[resource]);

      if (next[resource].has(action)) {
        next[resource].delete(action);
      } else {
        next[resource].add(action);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">Roles & Permissions</h1>
        <p className="text-sm text-slate-500 mt-1">Manage access control for your organization.</p>
      </div>

      {/* Preset Roles */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          System Roles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRESET_ROLES.map((role) => (
            <Card key={role.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{role.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    System
                  </Badge>
                </div>
                <CardDescription className="text-xs">{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {role.memberCount} members
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Roles - Gated behind org plan */}
      <FeatureGate featureKey="admin.custom_roles" variant="inline">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Custom Roles
            </h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Custom Role</DialogTitle>
                  <DialogDescription>
                    Define a new role with specific permissions and scope.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role-name">Role Name</Label>
                      <Input
                        id="role-name"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="e.g., Sales Lead"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="base-role">Base Role</Label>
                      <Select value={newRoleBaseRole} onValueChange={setNewRoleBaseRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRESET_ROLES.filter((r) => r.id !== "owner").map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-desc">Description</Label>
                    <Input
                      id="role-desc"
                      value={newRoleDescription}
                      onChange={(e) => setNewRoleDescription(e.target.value)}
                      placeholder="Describe this role's purpose"
                    />
                  </div>

                  {/* Permission Matrix */}
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2 font-medium">Resource</th>
                            {PERMISSION_ACTIONS.map((action) => (
                              <th key={action} className="text-center p-2 font-medium capitalize">
                                {action}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {PERMISSION_RESOURCES.map((resource) => (
                            <tr key={resource} className="border-t">
                              <td className="p-2 capitalize">{resource}</td>
                              {PERMISSION_ACTIONS.map((action) => (
                                <td key={action} className="text-center p-2">
                                  <Checkbox
                                    checked={newRolePermissions[resource]?.has(action) ?? false}
                                    onCheckedChange={() => togglePermission(resource, action)}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Scope */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>World Access</Label>
                      <div className="space-y-2">
                        {WORLDS.map((world) => (
                          <div key={world} className="flex items-center gap-2">
                            <Checkbox
                              id={`world-${world}`}
                              checked={newRoleWorlds.has(world)}
                              onCheckedChange={(checked) => {
                                setNewRoleWorlds((prev) => {
                                  const next = new Set(prev);
                                  if (checked) next.add(world);
                                  else next.delete(world);
                                  return next;
                                });
                              }}
                            />
                            <Label htmlFor={`world-${world}`} className="capitalize">
                              {world}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Department Access</Label>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {DEPARTMENTS.map((dept) => (
                          <div key={dept} className="flex items-center gap-2">
                            <Checkbox
                              id={`dept-${dept}`}
                              checked={newRoleDepartments.has(dept)}
                              onCheckedChange={(checked) => {
                                setNewRoleDepartments((prev) => {
                                  const next = new Set(prev);
                                  if (checked) next.add(dept);
                                  else next.delete(dept);
                                  return next;
                                });
                              }}
                            />
                            <Label htmlFor={`dept-${dept}`}>{dept}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRole} disabled={!newRoleName}>
                    Create Role
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {customRoles.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No custom roles yet. Create one to get started.
              </p>
            </Card>
          ) : (
            <DataTable
              title=""
              rows={customRoles as any}
              columns={customRoleColumns}
              onRowClick={(row) => setSelectedCustomRole(row)}
            />
          )}
        </div>
      </FeatureGate>

      {/* Edit Custom Role Drawer */}
      <DetailDrawer
        open={!!selectedCustomRole}
        onOpenChange={(open) => !open && setSelectedCustomRole(null)}
        title={selectedCustomRole?.name ?? "Custom Role"}
        description={selectedCustomRole?.description}
      >
        {selectedCustomRole && (
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Base Role</p>
              <Badge variant="outline" className="mt-2">
                {selectedCustomRole.baseRole}
              </Badge>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Members</p>
              <p className="text-lg font-semibold mt-2">{selectedCustomRole.memberCount}</p>
            </Card>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
