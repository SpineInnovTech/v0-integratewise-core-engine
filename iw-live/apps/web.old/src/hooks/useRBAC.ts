import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/contexts/tenant-context";
import { spineClient } from "@/utils/spine/client";

export interface RBACPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canAdmin: boolean;
  canApprove: boolean;
  role: string;
  permissions: string[];
  user: { id: string; email: string; name: string; avatar?: string } | null;
  isLoading: boolean;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

function checkPermissionMatch(userPermissions: string[], required: string): boolean {
  if (userPermissions.includes("*:*")) return true;
  if (userPermissions.includes(required)) return true;

  const [resource, operation] = required.split(":");
  if (userPermissions.includes(`${resource}:*`)) return true;
  if (userPermissions.includes(`*:${operation}`)) return true;

  return false;
}

export function useRBAC(resource?: string): RBACPermissions {
  const { tenantId } = useTenant();
  const [permissions, setPermissions] = useState<RBACPermissions>({
    canRead: false,
    canWrite: false,
    canDelete: false,
    canAdmin: false,
    canApprove: false,
    role: "viewer",
    permissions: [],
    user: null,
    isLoading: true,
    logout: () => {},
    hasPermission: () => false,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchPermissions() {
      try {
        const {
          data: { user },
        } = await spineClient.auth.getUser();
        if (!user || cancelled) return;

        const { data: roleData } = await spineClient
          .from("dXNlcl9yb2xlcw==")
          .select("role:roles(name, permissions)")
          .eq("user_id", user.id);

        const allPerms: string[] = [];
        let primaryRole = "viewer";

        if (roleData && roleData.length > 0) {
          for (const entry of roleData) {
            const role = entry.role as any;
            if (role) {
              if (role.name && primaryRole === "viewer") {
                primaryRole = role.name.toLowerCase();
              }
              if (Array.isArray(role.permissions)) {
                allPerms.push(...role.permissions);
              }
            }
          }
        }

        const uniquePerms = [...new Set(allPerms)];
        const prefix = resource ? `${resource}:` : "";

        const hasPermFn = (perm: string) => checkPermissionMatch(uniquePerms, perm);

        if (!cancelled) {
          setPermissions({
            canRead: hasPermFn(prefix ? `${resource}:read` : "*:read"),
            canWrite: hasPermFn(prefix ? `${resource}:write` : "*:write"),
            canDelete: hasPermFn(prefix ? `${resource}:delete` : "*:delete"),
            canAdmin: hasPermFn("*:*"),
            canApprove: hasPermFn(prefix ? `${resource}:approve` : "governance:approve"),
            role: primaryRole,
            permissions: uniquePerms,
            user: {
              id: user.id,
              email: user.email || "",
              name: user.user_metadata?.name || user.email?.split("@")[0] || "",
              avatar: user.user_metadata?.avatar_url,
            },
            isLoading: false,
            logout: () => spineClient.auth.signOut(),
            hasPermission: hasPermFn,
          });
        }
      } catch (err) {
        console.error("[useRBAC] Failed to fetch permissions:", err);
        if (!cancelled) {
          setPermissions((prev) => ({ ...prev, isLoading: false }));
        }
      }
    }

    fetchPermissions();
    return () => {
      cancelled = true;
    };
  }, [tenantId, resource]);

  return permissions;
}

export function usePermission(permission: string): { allowed: boolean; isLoading: boolean } {
  const { permissions, isLoading } = useRBAC();

  const allowed = checkPermissionMatch(permissions, permission);

  return { allowed, isLoading };
}

export function useAllPermissions(requiredPermissions: string[]): {
  allowed: boolean;
  isLoading: boolean;
} {
  const { permissions, isLoading } = useRBAC();

  const allowed = requiredPermissions.every((perm) => checkPermissionMatch(permissions, perm));

  return { allowed, isLoading };
}

export function useAnyPermission(requiredPermissions: string[]): {
  allowed: boolean;
  isLoading: boolean;
} {
  const { permissions, isLoading } = useRBAC();

  const allowed = requiredPermissions.some((perm) => checkPermissionMatch(permissions, perm));

  return { allowed, isLoading };
}

export function useRole(): { hasRole: boolean; isLoading: boolean; role: string } {
  const { role, isLoading } = useRBAC();

  return { hasRole: role !== "viewer", isLoading, role };
}

export function useAnyRole(roles: string[]): { hasAnyRole: boolean; isLoading: boolean } {
  const { role, isLoading } = useRBAC();

  const hasAnyRole = roles.map((r) => r.toLowerCase()).includes(role.toLowerCase());

  return { hasAnyRole, isLoading };
}

export default useRBAC;
