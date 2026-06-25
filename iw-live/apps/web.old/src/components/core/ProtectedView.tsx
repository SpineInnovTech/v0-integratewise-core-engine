import { ReactNode } from "react";
import { useViewAccess } from "@/hooks/useViewAccess";

interface ProtectedViewProps {
  viewId?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedView({
  viewId,
  children,
  fallback = <div className="p-4 text-gray-500">Access Denied</div>,
}: ProtectedViewProps) {
  const { hasAccess, isLoading } = useViewAccess(viewId);

  if (isLoading) {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default ProtectedView;
