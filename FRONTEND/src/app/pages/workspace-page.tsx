import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/auth-context";
import { WorkspaceShell } from "../components/workspace-shell";
import { SpineProvider } from "../components/spine/spine-client";

export function WorkspacePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, hasCompletedOnboarding, logout } = useAuth();

  // Redirect if not authenticated or onboarding not completed
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (!hasCompletedOnboarding) {
      navigate("/onboarding");
    }
  }, [isAuthenticated, hasCompletedOnboarding, navigate]);

  if (!isAuthenticated || !hasCompletedOnboarding || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <SpineProvider>
      <WorkspaceShell
        userName={user.name}
        userRole={user.role}
        activeCtx={user.defaultWorkspace}
        allowedWorkspaces={user.allowedWorkspaces}
        onLogout={handleLogout}
      />
    </SpineProvider>
  );
}