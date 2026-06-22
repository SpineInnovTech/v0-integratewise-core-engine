import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type CTXEnum, type OrgType } from "../components/spine/types";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  allowedWorkspaces: CTXEnum[];
  defaultWorkspace: CTXEnum;
  orgType?: OrgType;
  industry?: string;
  companySize?: string;
  primaryGoal?: string;
  tenantId?: string;
  bridgeConnected?: boolean;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  completeOnboarding: (data: any) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("integratewise_user");
    const storedOnboarding = localStorage.getItem("integratewise_onboarding");
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setHasCompletedOnboarding(storedOnboarding === "completed");
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    const isDemoUser = email === "alex@integrateWise.io" || email === "nirmal@integratewise.ai" || email === "admin@integratewise.ai";
    const mockUser: User = isDemoUser
      ? {
          id: "user_nirmal",
          email: email,
          name: "Nirmal",
          role: "super_admin",
          department: "BizOps",
          allowedWorkspaces: [
            "CTX_CS", "CTX_SALES", "CTX_SUPPORT", "CTX_PM",
            "CTX_MARKETING", "CTX_BIZOPS", "CTX_TECH",
            "CTX_HR", "CTX_FINANCE", "CTX_LEGAL"
          ],
          defaultWorkspace: "CTX_BIZOPS",
          orgType: "PRODUCT",
          industry: "SaaS",
          companySize: "1-10",
          primaryGoal: "Build the Continuity Operating System",
          tenantId: "tenant_integratewise",
          bridgeConnected: true,
        }
      : {
          id: "user_" + Math.random().toString(36).substr(2, 9),
          email,
          name: email.split("@")[0],
          role: "Admin",
          department: "Sales",
          allowedWorkspaces: ["CTX_SALES", "CTX_CS", "CTX_BIZOPS"],
          defaultWorkspace: "CTX_SALES",
        };

    setUser(mockUser);
    localStorage.setItem("integratewise_user", JSON.stringify(mockUser));

    if (isDemoUser) {
      setHasCompletedOnboarding(true);
      localStorage.setItem("integratewise_onboarding", "completed");
    } else {
      const onboardingStatus = localStorage.getItem("integratewise_onboarding");
      setHasCompletedOnboarding(onboardingStatus === "completed");
    }

    setIsLoading(false);
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: "user_" + Math.random().toString(36).substr(2, 9),
      email,
      name,
      role: "User",
      department: "",
      // New users start with no workspaces - assigned during onboarding
      allowedWorkspaces: [],
      defaultWorkspace: "CTX_BIZOPS",
    };

    setUser(mockUser);
    localStorage.setItem("integratewise_user", JSON.stringify(mockUser));
    setHasCompletedOnboarding(false);
    
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setHasCompletedOnboarding(false);
    localStorage.removeItem("integratewise_user");
    localStorage.removeItem("integratewise_onboarding");
  };

  const completeOnboarding = (data: any) => {
    if (!user) return;

    // Map department to allowed workspaces
    const workspaceMapping: Record<string, CTXEnum[]> = {
      "Sales": ["CTX_SALES", "CTX_BIZOPS"],
      "Marketing": ["CTX_MARKETING", "CTX_BIZOPS"],
      "RevOps": ["CTX_SALES", "CTX_MARKETING", "CTX_BIZOPS"],
      "Customer Success": ["CTX_CS", "CTX_BIZOPS"],
      "Engineering": ["CTX_TECH", "CTX_PM", "CTX_BIZOPS"],
      "Product Management": ["CTX_PM", "CTX_BIZOPS"],
      "IT/Technology": ["CTX_TECH", "CTX_BIZOPS"],
      "Operations": ["CTX_BIZOPS", "CTX_PM"],
      "Supply Chain": ["CTX_BIZOPS"],
      "Service Operations": ["CTX_SUPPORT", "CTX_BIZOPS"],
      "Project Management": ["CTX_PM", "CTX_BIZOPS"],
      "Finance/Accounting": ["CTX_FINANCE", "CTX_BIZOPS"],
      "HR/People": ["CTX_HR", "CTX_BIZOPS"],
      "Legal": ["CTX_LEGAL", "CTX_BIZOPS"],
    };

    // Determine allowed workspaces based on department
    const allowedWorkspaces = workspaceMapping[data.department] || ["CTX_BIZOPS"];
    const defaultWorkspace = allowedWorkspaces[0];

    const updatedUser: User = {
      ...user,
      name: data.userName,
      role: data.role || user.role,
      department: data.department,
      allowedWorkspaces,
      defaultWorkspace,
      orgType: data.orgType,
      industry: data.industry,
      companySize: data.companySize,
      primaryGoal: data.primaryGoal,
      tenantId: `tenant_${user.id}`,
      bridgeConnected: true,
    };

    setUser(updatedUser);
    setHasCompletedOnboarding(true);
    localStorage.setItem("integratewise_user", JSON.stringify(updatedUser));
    localStorage.setItem("integratewise_onboarding", "completed");
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    hasCompletedOnboarding,
    login,
    signup,
    logout,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
