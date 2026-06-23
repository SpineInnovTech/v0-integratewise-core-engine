import { useState, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DemoBanner } from "@/components/demo-banner";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { WorkspaceTopbar } from "./workspace-topbar";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

/**
 * Persistent application frame. The sidebar and topbar live OUTSIDE the route
 * switch, so they never unmount as the user navigates between modules — only
 * the `children` content swaps. This is the one stable shell.
 */
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">("desktop");

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < MOBILE_BREAKPOINT) {
        setScreenSize("mobile");
        setSidebarOpen(false);
        setMobileDrawerOpen(false);
      } else if (w < TABLET_BREAKPOINT) {
        setScreenSize("tablet");
        setSidebarOpen(false);
      } else {
        setScreenSize("desktop");
        setSidebarOpen(true);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isMobile = screenSize === "mobile";
  const toggle = () => (isMobile ? setMobileDrawerOpen((o) => !o) : setSidebarOpen((o) => !o));

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile drawer */}
      {isMobile && mobileDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileDrawerOpen(false)} />
      )}
      {isMobile && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden",
            mobileDrawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <WorkspaceSidebar onNavigate={() => setMobileDrawerOpen(false)} />
        </aside>
      )}

      {/* Desktop / tablet sidebar */}
      {!isMobile && (
        <aside className={cn("hidden h-full flex-shrink-0 transition-all duration-300 ease-in-out md:block", sidebarOpen ? "w-64" : "w-0")}>
          <div className={cn("h-full w-64 transition-transform duration-300 ease-in-out", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
            <WorkspaceSidebar />
          </div>
        </aside>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DemoBanner />
        <WorkspaceTopbar onToggleSidebar={toggle} sidebarOpen={sidebarOpen} isMobile={isMobile} />
        <main className="flex-1 overflow-hidden bg-background">{children}</main>
      </div>
    </div>
  );
}
