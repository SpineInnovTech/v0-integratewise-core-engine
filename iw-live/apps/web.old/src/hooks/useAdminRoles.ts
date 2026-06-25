import { useState, useEffect } from "react";

export interface AdminRole {
  id: string;
  name: string;
  permissions: string[];
  memberCount: number;
  description?: string;
  baseRole?: string;
  createdAt?: string;
}

export interface UseAdminRolesResult {
  roles: AdminRole[];
  loading: boolean;
  error: Error | null;
  createRole: (role: Partial<AdminRole>) => Promise<AdminRole>;
  updateRole: (id: string, role: Partial<AdminRole>) => Promise<AdminRole>;
  refresh: () => Promise<void>;
  refetch?: () => Promise<void>;
}

export function useAdminRoles(): UseAdminRolesResult {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createRole = async (role: Partial<AdminRole>): Promise<AdminRole> => {
    try {
      const newRole: AdminRole = {
        id: role.id || `role_${Date.now()}`,
        name: role.name || "New Role",
        permissions: role.permissions || [],
        memberCount: role.memberCount || 0,
        description: role.description,
        baseRole: role.baseRole,
        createdAt: new Date().toISOString(),
      };
      setRoles((prev) => [...prev, newRole]);
      return newRole;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      throw err;
    }
  };

  const updateRole = async (id: string, role: Partial<AdminRole>): Promise<AdminRole> => {
    try {
      const updated = { ...roles.find((r) => r.id === id), ...role } as AdminRole;
      setRoles((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      throw err;
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      setRoles([]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { roles, loading, error, createRole, updateRole, refresh };
}

export default useAdminRoles;
