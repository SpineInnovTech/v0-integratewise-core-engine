"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { SlidingPanel, PanelPosition, PanelSize } from "./sliding-panel";

// L2 Cognitive Surface types
export type CognitiveSurface =
  | "spine" // SSOT viewer
  | "context" // Context store browser
  | "knowledge" // Knowledge bank
  | "evidence" // Evidence drawer
  | "signals" // Signals / Situations
  | "think" // Think surface
  | "act" // Act surface
  | "govern" // Governance panel
  | "adjust" // Adjustment panel
  | "audit" // Audit trail
  | "agent" // Agent config
  | "twin" // Digital twin
  | "chat" // AI chat
  | "search" // Universal search
  | null;

interface PanelConfig {
  surface: CognitiveSurface;
  title: string;
  subtitle?: string;
  position: PanelPosition;
  size: PanelSize;
  data?: Record<string, unknown>;
}

interface CognitivePanelContextType {
  activeSurface: CognitiveSurface;
  panelData: Record<string, unknown>;
  isPinned: boolean;
  isMaximized: boolean;
  openPanel: (config: Partial<PanelConfig> & { surface: CognitiveSurface }) => void;
  closePanel: () => void;
  togglePin: () => void;
  toggleMaximize: () => void;
  setData: (data: Record<string, unknown>) => void;
}

const CognitivePanelContext = createContext<CognitivePanelContextType | null>(null);

// Default configurations for each cognitive surface
const surfaceDefaults: Record<Exclude<CognitiveSurface, null>, Omit<PanelConfig, "data">> = {
  spine: {
    surface: "spine",
    title: "Spine DB",
    subtitle: "Single Source of Truth",
    position: "right",
    size: "lg",
  },
  context: {
    surface: "context",
    title: "Context Store",
    subtitle: "Unstructured + Embeddings",
    position: "right",
    size: "lg",
  },
  knowledge: {
    surface: "knowledge",
    title: "Knowledge Bank",
    subtitle: "AI-powered insights",
    position: "right",
    size: "lg",
  },
  evidence: {
    surface: "evidence",
    title: "Evidence",
    subtitle: "Data lineage & provenance",
    position: "right",
    size: "md",
  },
  signals: {
    surface: "signals",
    title: "Signals",
    subtitle: "Situations & Triggers",
    position: "right",
    size: "md",
  },
  think: {
    surface: "think",
    title: "Think",
    subtitle: "AI reasoning engine",
    position: "right",
    size: "lg",
  },
  act: {
    surface: "act",
    title: "Act",
    subtitle: "Actions & automations",
    position: "right",
    size: "md",
  },
  govern: {
    surface: "govern",
    title: "Governance",
    subtitle: "Policies & approvals",
    position: "right",
    size: "md",
  },
  adjust: {
    surface: "adjust",
    title: "Adjust",
    subtitle: "Tune & calibrate",
    position: "right",
    size: "md",
  },
  audit: {
    surface: "audit",
    title: "Audit Trail",
    subtitle: "Immutable history",
    position: "right",
    size: "lg",
  },
  agent: {
    surface: "agent",
    title: "Agent Config",
    subtitle: "AI agent registry",
    position: "right",
    size: "md",
  },
  twin: {
    surface: "twin",
    title: "Digital Twin",
    subtitle: "Memory & proactive context",
    position: "right",
    size: "lg",
  },
  chat: {
    surface: "chat",
    title: "AI Assistant",
    subtitle: "Ask anything",
    position: "right",
    size: "md",
  },
  search: {
    surface: "search",
    title: "Universal Search",
    subtitle: "Search everything",
    position: "right",
    size: "lg",
  },
};

export function CognitivePanelProvider({ children }: { children: ReactNode }) {
  const [activeSurface, setActiveSurface] = useState<CognitiveSurface>(null);
  const [panelConfig, setPanelConfig] = useState<PanelConfig | null>(null);
  const [panelData, setPanelData] = useState<Record<string, unknown>>({});
  const [isPinned, setIsPinned] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const openPanel = useCallback((config: Partial<PanelConfig> & { surface: CognitiveSurface }) => {
    const defaults = config.surface ? surfaceDefaults[config.surface] : null;
    if (!defaults) return;

    setPanelConfig({
      ...defaults,
      ...config,
    });
    setActiveSurface(config.surface);
    if (config.data) {
      setPanelData(config.data);
    }
  }, []);

  const closePanel = useCallback(() => {
    if (!isPinned) {
      setActiveSurface(null);
      setPanelConfig(null);
      setPanelData({});
      setIsMaximized(false);
    }
  }, [isPinned]);

  const togglePin = useCallback(() => {
    setIsPinned((prev) => !prev);
  }, []);

  const toggleMaximize = useCallback(() => {
    setIsMaximized((prev) => !prev);
  }, []);

  const setData = useCallback((data: Record<string, unknown>) => {
    setPanelData(data);
  }, []);

  return (
    <CognitivePanelContext.Provider
      value={{
        activeSurface,
        panelData,
        isPinned,
        isMaximized,
        openPanel,
        closePanel,
        togglePin,
        toggleMaximize,
        setData,
      }}
    >
      {children}

      {/* Render the active panel */}
      {panelConfig && (
        <SlidingPanel
          isOpen={activeSurface !== null}
          onClose={closePanel}
          title={panelConfig.title}
          subtitle={panelConfig.subtitle}
          position={panelConfig.position}
          size={isMaximized ? "full" : panelConfig.size}
          isPinned={isPinned}
          onPinToggle={togglePin}
          isMaximized={isMaximized}
          onMaximizeToggle={toggleMaximize}
          showOverlay={!isPinned}
        >
          {activeSurface && <CognitiveSurfaceContent surface={activeSurface} data={panelData} />}
        </SlidingPanel>
      )}
    </CognitivePanelContext.Provider>
  );
}

export function useCognitivePanel() {
  const context = useContext(CognitivePanelContext);
  if (!context) {
    throw new Error("useCognitivePanel must be used within CognitivePanelProvider");
  }
  return context;
}

// Dynamic content renderer for each surface
function CognitiveSurfaceContent({
  surface,
  data,
}: {
  surface: CognitiveSurface;
  data: Record<string, unknown>;
}): React.ReactElement {
  switch (surface) {
    case "spine":
      return <SpineSurface data={data} />;
    case "context":
      return <ContextSurface data={data} />;
    case "knowledge":
      return <KnowledgeSurface data={data} />;
    case "evidence":
      return <EvidenceSurface data={data} />;
    case "signals":
      return <SignalsSurface data={data} />;
    case "think":
      return <ThinkSurface data={data} />;
    case "act":
      return <ActSurface data={data} />;
    case "govern":
      return <GovernSurface data={data} />;
    case "chat":
      return <ChatSurface data={data} />;
    case "search":
      return <SearchSurface data={data} />;
    case "audit":
      return <AuditSurface data={data} />;
    default:
      return <DefaultSurface surface={surface} />;
  }
}

// Surface components - these are stubs that can be expanded
function SpineSurface({ data }: { data: Record<string, unknown> }): React.ReactElement {
  return (
    <div className="p-4 space-y-4">
      <div className="p-4 border rounded-lg bg-muted/30">
        <h3 className="font-medium mb-2">Entity Viewer</h3>
        <p className="text-sm text-muted-foreground">
          Browse SSOT entities: Accounts, Contacts, Projects, etc.
        </p>
      </div>
      {data.entityId ? (
        <div className="p-4 border rounded-lg">
          <p className="text-sm">
            Viewing entity: <code>{String(data.entityId)}</code>
          </p>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        {["Accounts", "Contacts", "Projects", "Meetings"].map((entity) => (
          <button key={entity} className="p-3 border rounded-lg hover:bg-muted/50 text-left">
            <p className="font-medium">{entity}</p>
            <p className="text-xs text-muted-foreground">View all</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ContextSurface({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="p-4 space-y-4">
      <div className="p-4 border rounded-lg bg-muted/30">
        <h3 className="font-medium mb-2">Context Browser</h3>
        <p className="text-sm text-muted-foreground">
          Unstructured data, embeddings, and semantic search
        </p>
      </div>
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Semantic search..."
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
    </div>
  );
}

function KnowledgeSurface({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="p-4 space-y-4">
      <div className="p-4 border rounded-lg bg-[var(--iw-gold)]/10 dark:bg-iw-gold/10">
        <h3 className="font-medium mb-2">Knowledge Bank</h3>
        <p className="text-sm text-muted-foreground">
          AI-curated insights, patterns, and intelligence
        </p>
      </div>
    </div>
  );
}

function EvidenceSurface({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="p-4 space-y-4">
      <div className="p-4 border rounded-lg bg-[var(--iw-forest)]/10 dark:bg-iw-forest/10">
        <h3 className="font-medium mb-2">Evidence Trail</h3>
        <p className="text-sm text-muted-foreground">
          Data lineage, source tracking, and provenance
        </p>
      </div>
      {data.claim ? (
        <div className="p-4 border rounded-lg">
          <p className="text-sm font-medium">Claim:</p>
          <p className="text-sm text-muted-foreground">{String(data.claim)}</p>
        </div>
      ) : null}
    </div>
  );
}

function SignalsSurface({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="p-4 space-y-4">
      <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
        <h3 className="font-medium mb-2">Signals & Situations</h3>
        <p className="text-sm text-muted-foreground">
          Real-time triggers, alerts, and pattern detection
        </p>
      </div>
    </div>
  );
}

function ThinkSurface({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="p-4 space-y-4">
      <div className="p-4 border rounded-lg bg-gradient-to-br from-[var(--iw-forest)]/10 via-[var(--iw-gold)]/10 to-[var(--iw-forest)]/5 dark:from-iw-forest/10 dark:to-iw-gold/5">
        <h3 className="font-medium mb-2">Think Engine</h3>
        <p className="text-sm text-muted-foreground">AI reasoning, analysis, and recommendations</p>
      </div>
    </div>
  );
}

function ActSurface({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="p-4 space-y-4">
      <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
        <h3 className="font-medium mb-2">Act Engine</h3>
        <p className="text-sm text-muted-foreground">Execute actions, automations, and workflows</p>
      </div>
    </div>
  );
}

function GovernSurface({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="p-4 space-y-4">
      <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
        <h3 className="font-medium mb-2">Governance</h3>
        <p className="text-sm text-muted-foreground">Policies, approvals, and compliance</p>
      </div>
    </div>
  );
}

function ChatSurface({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 space-y-4">
        <div className="p-4 border rounded-lg bg-muted/30">
          <p className="text-sm">How can I help you today?</p>
        </div>
      </div>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask anything..."
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Send</button>
        </div>
      </div>
    </div>
  );
}

function SearchSurface({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="p-4 space-y-4">
      <input
        type="text"
        placeholder="Search across all data..."
        className="w-full px-4 py-3 text-lg border rounded-lg"
        autoFocus
      />
      <div className="text-sm text-muted-foreground">
        <p>Search across: Accounts, Contacts, Meetings, Docs, Notes, Knowledge...</p>
      </div>
    </div>
  );
}

function AuditSurface({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="p-4 space-y-4">
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/20">
        <h3 className="font-medium mb-2">Audit Trail</h3>
        <p className="text-sm text-muted-foreground">
          Immutable history of all actions and changes
        </p>
      </div>
    </div>
  );
}

function DefaultSurface({ surface }: { surface: CognitiveSurface }) {
  return (
    <div className="p-4">
      <p className="text-muted-foreground">Surface: {surface || "None"}</p>
    </div>
  );
}
