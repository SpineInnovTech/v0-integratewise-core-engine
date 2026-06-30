import { useState, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { WorkspaceTopbar } from "./workspace-topbar";
import { AIHome } from "./ai-home";
import { AIOverlay } from "./ai-overlay";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export type WorkspaceMode = "work" | "ai";

/**
 * Persistent application frame. Three spaces:
 *   1. Human Workbench (sidebar + main content) — where the human works
 *   2. AI Home (center, replaces main when mode="ai") — where AI works
 *   3. AI Overlay (right panel, non-disruptive) — where Human+AI communicate
 *
 * The sidebar and topbar never unmount across navigation.
 * The overlay never covers the human's work area — it slides in alongside it.
 */
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [mode, setMode] = useState<WorkspaceMode>("work");
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < MOBILE_BREAKPOINT) {
        setScreenSize("mobile");
        setSidebarOpen(false);
        setMobileDrawerOpen(false);
        setOverlayOpen(false);
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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Mobile drawer backdrop ── */}
      {isMobile && mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      {isMobile && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out",
            mobileDrawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <WorkspaceSidebar onNavigate={() => setMobileDrawerOpen(false)} mode={mode} />
        </aside>
      )}

      {/* ── Desktop / tablet sidebar ── */}
      {!isMobile && (
        <aside
          className={cn(
            "hidden h-full flex-shrink-0 transition-all duration-300 ease-in-out md:block",
            sidebarOpen ? "w-64" : "w-0",
          )}
        >
          <div
            className={cn(
              "h-full w-64 transition-transform duration-300 ease-in-out",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <WorkspaceSidebar mode={mode} />
          </div>
        </aside>
      )}

      {/* ── Main column (topbar + content + overlay) ── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <WorkspaceTopbar
          onToggleSidebar={toggle}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
          mode={mode}
          setMode={setMode}
          overlayOpen={overlayOpen}
          setOverlayOpen={setOverlayOpen}
        />

        {/* ── Content row: work area + optional overlay ── */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Center: Human Workbench OR AI Home */}
          <main className="flex-1 overflow-hidden bg-background min-w-0">
            {mode === "work" ? children : <AIHome />}
          </main>

          {/* Right: AI Overlay — slides in, never covers the left */}
          {overlayOpen && !isMobile && (
            <AIOverlay onClose={() => setOverlayOpen(false)} />
          )}

          {/* Mobile overlay — sheet-style from bottom */}
          {overlayOpen && isMobile && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setOverlayOpen(false)}
              />
              <div className="relative z-10 h-[80vh] w-full rounded-t-2xl border-t border-border bg-background overflow-hidden flex flex-col">
                <AIOverlay onClose={() => setOverlayOpen(false)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
