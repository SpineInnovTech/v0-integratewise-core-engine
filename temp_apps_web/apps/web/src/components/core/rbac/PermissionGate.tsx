"use client";

import React from "react";
import {
  usePermission,
  useAllPermissions,
  useAnyPermission,
  useRole,
  useAnyRole,
} from "@/hooks/use-rbac";

// ============================================================================
// Permission Gate Components
// ============================================================================

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * Gate component that only renders children if user has the specified permission
 *
 * @example
 * ```tsx
 * <PermissionGate permission="account:delete">
 *   <DeleteAccountButton />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
  loading = null,
}: PermissionGateProps) {
  const { allowed, isLoading } = usePermission(permission);

  if (isLoading) return <>{loading}</>;
  if (!allowed) return <>{fallback}</>;

  return <>{children}</>;
}

interface AllPermissionsGateProps {
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * Gate component that only renders children if user has ALL of the specified permissions
 *
 * @example
 * ```tsx
 * <AllPermissionsGate permissions={['account:read', 'account:update']}>
 *   <EditAccountForm />
 * </AllPermissionsGate>
 * ```
 */
export function AllPermissionsGate({
  permissions,
  children,
  fallback = null,
  loading = null,
}: AllPermissionsGateProps) {
  const { allowed, isLoading } = useAllPermissions(permissions);

  if (isLoading) return <>{loading}</>;
  if (!allowed) return <>{fallback}</>;

  return <>{children}</>;
}

interface AnyPermissionGateProps {
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * Gate component that only renders children if user has ANY of the specified permissions
 *
 * @example
 * ```tsx
 * <AnyPermissionGate permissions={['account:admin', 'account:update']}>
 *   <EditAccountButton />
 * </AnyPermissionGate>
 * ```
 */
export function AnyPermissionGate({
  permissions,
  children,
  fallback = null,
  loading = null,
}: AnyPermissionGateProps) {
  const { allowed, isLoading } = useAnyPermission(permissions);

  if (isLoading) return <>{loading}</>;
  if (!allowed) return <>{fallback}</>;

  return <>{children}</>;
}

interface RoleGateProps {
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * Gate component that only renders children if user has the specified role
 *
 * @example
 * ```tsx
 * <RoleGate role="Admin">
 *   <AdminPanel />
 * </RoleGate>
 * ```
 */
export function RoleGate({ role, children, fallback = null, loading = null }: RoleGateProps) {
  const { hasAnyRole: hasRole, isLoading } = useAnyRole([role]);

  if (isLoading) return <>{loading}</>;
  if (!hasRole) return <>{fallback}</>;

  return <>{children}</>;
}

interface AnyRoleGateProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * Gate component that only renders children if user has ANY of the specified roles
 *
 * @example
 * ```tsx
 * <AnyRoleGate roles={['Admin', 'Manager']}>
 *   <ManagementPanel />
 * </AnyRoleGate>
 * ```
 */
export function AnyRoleGate({
  roles,
  children,
  fallback = null,
  loading = null,
}: AnyRoleGateProps) {
  const { hasAnyRole, isLoading } = useAnyRole(roles);

  if (isLoading) return <>{loading}</>;
  if (!hasAnyRole) return <>{fallback}</>;

  return <>{children}</>;
}
