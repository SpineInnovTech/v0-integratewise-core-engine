import { useState, useCallback, useRef, useEffect } from "react";
import {
  Zap,
  GitBranch,
  Clock,
  Mail,
  MessageSquare,
  Filter,
  Database,
  CheckCircle,
  AlertTriangle,
  Bot,
  Shield,
  ArrowRight,
  Plus,
  Trash2,
  Settings,
  Play,
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GripVertical,
  ChevronRight,
  X,
  Webhook,
  Timer,
  Split,
  Merge,
  Code,
  Globe,
  Upload,
  Download,
  Eye,
} from "lucide-react";

// ========================================
// Types
// ========================================
interface CanvasNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  config: Record<string, any>;
  status?: "idle" | "running" | "success" | "error";
}

interface Connection {
  id: string;
  from: string;
  to: string;
  fromPort: "output" | "true" | "false";
  label?: string;
}

type NodeType =
  | "trigger"
  | "action"
  | "condition"
  | "delay"
  | "email"
  | "slack"
  | "webhook"
  | "ai_agent"
  | "approval"
  | "transform"
  | "api_call"
  | "loop"
  | "end";

interface NodeTemplate {
  type: NodeType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  category: "triggers" | "actions" | "logic" | "integrations" | "ai";
  description: string;
}

// ========================================
// Node Templates
// ========================================
const nodeTemplates: NodeTemplate[] = [
  { type: "trigger", label: "Event Trigger", icon: Zap, color: "#FF9800", bg: "rgba(255,152,0,0.15)", category: "triggers", description: "Start on event" },
  { type: "webhook", label: "Webhook", icon: Webhook, color: "#7C4DFF", bg: "rgba(124,77,255,0.15)", category: "triggers", description: "HTTP webhook" },
  { type: "action", label: "Action Step", icon: Play, color: "#0066FF", bg: "rgba(0,102,255,0.15)", category: "actions", description: "Execute action" },
  { type: "email", label: "Send Email", icon: Mail, color: "#FF4081", bg: "rgba(255,64,129,0.15)", category: "actions", description: "Send email" },
  { type: "slack", label: "Slack Message", icon: MessageSquare, color: "#00C853", bg: "rgba(0,200,83,0.15)", category: "actions", description: "Post to Slack" },
  { type: "api_call", label: "API Call", icon: Globe, color: "#00BCD4", bg: "rgba(0,188,212,0.15)", category: "integrations", description: "Call external API" },
  { type: "transform", label: "Transform Data", icon: Code, color: "#9E9E9E", bg: "rgba(158,158,158,0.15)", category: "actions", description: "Map & transform" },
  { type: "condition", label: "Condition", icon: Split, color: "#FF9800", bg: "rgba(255,152,0,0.15)", category: "logic", description: "If/else branch" },
  { type: "delay", label: "Delay/Wait", icon: Timer, color: "#795548", bg: "rgba(121,85,72,0.15)", category: "logic", description: "Wait for time" },
  { type: "loop", label: "Loop/Iterate", icon: Merge, color: "#607D8B", bg: "rgba(96,125,139,0.15)", category: "logic", description: "Iterate over list" },
  { type: "ai_agent", label: "AI Agent", icon: Bot, color: "#7C4DFF", bg: "rgba(124,77,255,0.15)", category: "ai", description: "AI processing" },
  { type: "approval", label: "Approval Gate", icon: Shield, color: "#F44336", bg: "rgba(244,67,54,0.15)", category: "logic", description: "Require approval" },
  { type: "end", label: "End", icon: CheckCircle, color: "#00C853", bg: "rgba(0,200,83,0.15)", category: "logic", description: "Workflow end" },
];

const categoryLabels: Record<string, string> = {
  triggers: "Triggers",
  actions: "Actions",
  logic: "Logic & Flow",
  integrations: "Integrations",
  ai: "AI & Intelligence",
};

// ========================================
// Initial workflow for demo
// ========================================
const initialNodes: CanvasNode[] = [
  { id: "n1", type: "trigger", label: "New Lead Created", x: 100, y: 100, config: { event: "lead.created", source: "Salesforce" }, status: "success" },
  { id: "n2", type: "condition", label: "APAC Region?", x: 400, y: 100, config: { field: "region", operator: "equals", value: "APAC" }, status: "success" },
  { id: "n3", type: "ai_agent", label: "Score Lead", x: 700, y: 40, config: { model: "gpt-4", prompt: "Score lead based on firmographics" }, status: "success" },
  { id: "n4", type: "slack", label: "Notify Non-APAC Team", x: 700, y: 220, config: { channel: "#sales-global", message: "New non-APAC lead assigned" }, status: "idle" },
  { id: "n5", type: "action", label: "Assign to APAC Rep", x: 1000, y: 40, config: { action: "assign_owner", team: "APAC Sales" }, status: "running" },
  { id: "n6", type: "email", label: "Welcome Email", x: 1300, y: 40, config: { template: "welcome_lead", subject: "Welcome to IntegrateWise" }, status: "idle" },
  { id: "n7", type: "end", label: "Done", x: 1550, y: 40, config: {}, status: "idle" },
];

const initialConnections: Connection[] = [
  { id: "c1", from: "n1", to: "n2", fromPort: "output" },
  { id: "c2", from: "n2", to: "n3", fromPort: "true", label: "Yes" },
  { id: "c3", from: "n2", to: "n4", fromPort: "false", label: "No" },
  { id: "c4", from: "n3", to: "n5", fromPort: "output" },
  { id: "c5", from: "n5", to: "n6", fromPort: "output" },
  { id: "c6", from: "n6", to: "n7", fromPort: "output" },
];

// ========================================
// Canvas Component
// ========================================
export function WorkflowCanvas() {
  const [nodes, setNodes] = useState<CanvasNode[]>(initialNodes);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; port: "output" | "true" | "false" } | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.85);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showNodePanel, setShowNodePanel] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [workflowName, setWorkflowName] = useState("New Lead Routing (APAC)");
  const [isRunning, setIsRunning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 72;

  // Handle node drag
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragState({
      nodeId,
      offsetX: (e.clientX - rect.left) / zoom - panOffset.x - node.x,
      offsetY: (e.clientY - rect.top) / zoom - panOffset.y - node.y,
    });
    setSelectedNode(nodeId);
    setShowConfigPanel(true);
  }, [nodes, zoom, panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragState) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / zoom - panOffset.x - dragState.offsetX;
      const y = (e.clientY - rect.top) / zoom - panOffset.y - dragState.offsetY;
      setNodes((prev) =>
        prev.map((n) => (n.id === dragState.nodeId ? { ...n, x: Math.round(x / 10) * 10, y: Math.round(y / 10) * 10 } : n))
      );
    }
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset((prev) => ({ x: prev.x + dx / zoom, y: prev.y + dy / zoom }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [dragState, isPanning, panStart, zoom, panOffset]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setIsPanning(false);
  }, []);

  // Canvas pan
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !dragState) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setSelectedNode(null);
      setShowConfigPanel(false);
    }
  };

  // Add node from palette
  const handleAddNode = (template: NodeTemplate) => {
    const newId = `n${Date.now()}`;
    const newNode: CanvasNode = {
      id: newId,
      type: template.type,
      label: template.label,
      x: 300 - panOffset.x,
      y: 200 - panOffset.y,
      config: {},
      status: "idle",
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newId);
    setShowConfigPanel(true);
  };

  // Delete selected node
  const deleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setConnections((prev) => prev.filter((c) => c.from !== nodeId && c.to !== nodeId));
    setSelectedNode(null);
    setShowConfigPanel(false);
  };

  // Start connecting
  const handlePortClick = (e: React.MouseEvent, nodeId: string, port: "output" | "true" | "false") => {
    e.stopPropagation();
    if (connectingFrom) {
      // Complete connection
      if (connectingFrom.nodeId !== nodeId) {
        const newConn: Connection = {
          id: `c${Date.now()}`,
          from: connectingFrom.nodeId,
          to: nodeId,
          fromPort: connectingFrom.port,
          label: connectingFrom.port === "true" ? "Yes" : connectingFrom.port === "false" ? "No" : undefined,
        };
        setConnections((prev) => [...prev, newConn]);
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom({ nodeId, port });
    }
  };

  // Delete connection
  const deleteConnection = (connId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connId));
  };

  // Simulate workflow run
  const simulateRun = () => {
    setIsRunning(true);
    const orderedNodes = [...nodes];
    let i = 0;
    const interval = setInterval(() => {
      if (i < orderedNodes.length) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === orderedNodes[i].id ? { ...n, status: "running" } : n.status === "running" ? { ...n, status: "success" } : n
          )
        );
        i++;
      } else {
        setNodes((prev) => prev.map((n) => (n.status === "running" ? { ...n, status: "success" } : n)));
        setIsRunning(false);
        clearInterval(interval);
      }
    }, 600);
  };

  // Get node position for connections
  const getNodeCenter = (nodeId: string, port: "output" | "true" | "false" | "input") => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    if (port === "input") return { x: node.x, y: node.y + NODE_HEIGHT / 2 };
    if (port === "output") return { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 };
    if (port === "true") return { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 3 };
    if (port === "false") return { x: node.x + NODE_WIDTH, y: node.y + (NODE_HEIGHT * 2) / 3 };
    return { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 };
  };

  // Generate curved path
  const getCurvePath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dx = to.x - from.x;
    const cp = Math.max(Math.abs(dx) * 0.5, 60);
    return `M ${from.x} ${from.y} C ${from.x + cp} ${from.y}, ${to.x - cp} ${to.y}, ${to.x} ${to.y}`;
  };

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);
  const selectedTemplate = selectedNodeData ? nodeTemplates.find((t) => t.type === selectedNodeData.type) : null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-sm bg-transparent border-none outline-none min-w-[200px]"
              style={{ fontWeight: 600 }}
            />
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--iw-success)]/10 text-[var(--iw-success)]" style={{ fontWeight: 500 }}>
            Draft
          </span>
          <span className="text-[10px] text-muted-foreground">{nodes.length} nodes · {connections.length} connections</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground" title="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground" title="Redo">
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button onClick={() => setZoom((z) => Math.min(z + 0.1, 2))} className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-muted-foreground min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))} className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => { setZoom(0.85); setPanOffset({ x: 0, y: 0 }); }} className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground" title="Fit">
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={simulateRun}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-white transition-all ${
              isRunning ? "bg-[var(--iw-warning)] animate-pulse" : "bg-[var(--iw-success)] hover:opacity-90"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            {isRunning ? "Running..." : "Test Run"}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs hover:opacity-90 transition-opacity">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette */}
        {showNodePanel && (
          <div className="w-[220px] border-r border-border bg-card overflow-y-auto flex-shrink-0">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ fontWeight: 600 }}>Node Palette</span>
                <button onClick={() => setShowNodePanel(false)} className="p-0.5 rounded hover:bg-secondary transition-colors">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
              {Object.entries(categoryLabels).map(([catKey, catLabel]) => {
                const catNodes = nodeTemplates.filter((t) => t.category === catKey);
                return (
                  <div key={catKey} className="mb-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 px-1" style={{ fontWeight: 600 }}>
                      {catLabel}
                    </div>
                    <div className="space-y-1">
                      {catNodes.map((template) => {
                        const Icon = template.icon;
                        return (
                          <button
                            key={template.type}
                            onClick={() => handleAddNode(template)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary transition-colors text-left group"
                          >
                            <div
                              className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: template.bg }}
                            >
                              <Icon className="w-3.5 h-3.5" style={{ color: template.color }} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] truncate" style={{ fontWeight: 500 }}>{template.label}</div>
                              <div className="text-[9px] text-muted-foreground truncate">{template.description}</div>
                            </div>
                            <Plus className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ background: "var(--background)" }}
        >
          {/* Grid Pattern */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
            <defs>
              <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse" x={(panOffset.x * zoom) % (20 * zoom)} y={(panOffset.y * zoom) % (20 * zoom)}>
                <circle cx="1" cy="1" r="0.5" fill="var(--muted-foreground)" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Toggle Node Panel */}
          {!showNodePanel && (
            <button
              onClick={() => setShowNodePanel(true)}
              className="absolute top-3 left-3 z-10 p-2 rounded-md bg-card border border-border shadow-sm hover:bg-secondary transition-colors"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Connection Mode Indicator */}
          {connectingFrom && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/30 text-xs text-primary" style={{ fontWeight: 500 }}>
              Click a node's input port to connect · Press Escape to cancel
            </div>
          )}

          {/* Canvas Content */}
          <div
            style={{
              transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: "0 0",
              position: "absolute",
              top: 0,
              left: 0,
              width: "4000px",
              height: "4000px",
            }}
          >
            {/* Connection Lines (SVG) */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: "visible" }}
            >
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="var(--muted-foreground)" opacity="0.5" />
                </marker>
                <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="var(--primary)" />
                </marker>
              </defs>
              {connections.map((conn) => {
                const from = getNodeCenter(conn.from, conn.fromPort);
                const to = getNodeCenter(conn.to, "input");
                const path = getCurvePath(from, to);
                const isActive = nodes.find((n) => n.id === conn.from)?.status === "success";
                return (
                  <g key={conn.id}>
                    <path
                      d={path}
                      fill="none"
                      stroke={isActive ? "var(--primary)" : "var(--muted-foreground)"}
                      strokeWidth={isActive ? 2 : 1.5}
                      strokeDasharray={isActive ? "none" : "none"}
                      opacity={isActive ? 0.8 : 0.3}
                      markerEnd={isActive ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                    />
                    {/* Animated pulse for active connections */}
                    {isActive && (
                      <circle r="3" fill="var(--primary)">
                        <animateMotion dur="1.5s" repeatCount="indefinite" path={path} />
                      </circle>
                    )}
                    {conn.label && (
                      <text
                        x={(from.x + to.x) / 2}
                        y={(from.y + to.y) / 2 - 8}
                        textAnchor="middle"
                        fill="var(--muted-foreground)"
                        fontSize="10"
                        fontWeight="500"
                      >
                        {conn.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => {
              const template = nodeTemplates.find((t) => t.type === node.type);
              if (!template) return null;
              const Icon = template.icon;
              const isSelected = selectedNode === node.id;
              const isCondition = node.type === "condition";

              const statusBorderColor =
                node.status === "running" ? "var(--iw-warning)" :
                node.status === "success" ? "var(--iw-success)" :
                node.status === "error" ? "var(--iw-danger)" :
                isSelected ? "var(--primary)" : "var(--border)";

              return (
                <div
                  key={node.id}
                  className={`absolute select-none transition-shadow ${
                    isSelected ? "shadow-lg ring-2 ring-primary/30" : "shadow-sm hover:shadow-md"
                  }`}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                    borderRadius: isCondition ? "8px" : "10px",
                    border: `2px solid ${statusBorderColor}`,
                    backgroundColor: "var(--card)",
                    cursor: dragState?.nodeId === node.id ? "grabbing" : "grab",
                    zIndex: isSelected ? 10 : 1,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node.id);
                    setShowConfigPanel(true);
                  }}
                >
                  {/* Node Status Indicator */}
                  {node.status && node.status !== "idle" && (
                    <div
                      className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card flex items-center justify-center ${
                        node.status === "running" ? "animate-pulse" : ""
                      }`}
                      style={{
                        backgroundColor:
                          node.status === "success" ? "var(--iw-success)" :
                          node.status === "running" ? "var(--iw-warning)" :
                          "var(--iw-danger)",
                      }}
                    >
                      {node.status === "success" && <CheckCircle className="w-2 h-2 text-white" />}
                      {node.status === "error" && <AlertTriangle className="w-2 h-2 text-white" />}
                    </div>
                  )}

                  {/* Node Content */}
                  <div className="flex items-center gap-2.5 p-2.5 h-full">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: template.bg }}
                    >
                      <Icon className="w-4 h-4" style={{ color: template.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] truncate" style={{ fontWeight: 600 }}>{node.label}</div>
                      <div className="text-[9px] text-muted-foreground truncate">{template.description}</div>
                    </div>
                  </div>

                  {/* Input Port (left) */}
                  {node.type !== "trigger" && node.type !== "webhook" && (
                    <div
                      className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 bg-card cursor-crosshair hover:bg-primary hover:border-primary transition-colors z-20"
                      style={{ borderColor: connectingFrom ? "var(--primary)" : "var(--border)" }}
                      onClick={(e) => {
                        if (connectingFrom) {
                          handlePortClick(e, node.id, "output");
                        }
                      }}
                    />
                  )}

                  {/* Output Port(s) (right) */}
                  {node.type !== "end" && !isCondition && (
                    <div
                      className="absolute -right-[7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 bg-card cursor-crosshair hover:bg-primary hover:border-primary transition-colors z-20"
                      style={{ borderColor: "var(--border)" }}
                      onClick={(e) => handlePortClick(e, node.id, "output")}
                    />
                  )}

                  {/* Condition has two output ports */}
                  {isCondition && (
                    <>
                      <div
                        className="absolute -right-[7px] top-1/3 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 bg-card cursor-crosshair hover:bg-[var(--iw-success)] hover:border-[var(--iw-success)] transition-colors z-20"
                        style={{ borderColor: "var(--iw-success)" }}
                        onClick={(e) => handlePortClick(e, node.id, "true")}
                        title="True"
                      >
                        <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[8px] text-[var(--iw-success)]" style={{ fontWeight: 600 }}>T</span>
                      </div>
                      <div
                        className="absolute -right-[7px] top-2/3 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 bg-card cursor-crosshair hover:bg-[var(--iw-danger)] hover:border-[var(--iw-danger)] transition-colors z-20"
                        style={{ borderColor: "var(--iw-danger)" }}
                        onClick={(e) => handlePortClick(e, node.id, "false")}
                        title="False"
                      >
                        <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[8px] text-[var(--iw-danger)]" style={{ fontWeight: 600 }}>F</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mini-map */}
          <div className="absolute bottom-3 right-3 w-[140px] h-[90px] rounded-md bg-card/80 border border-border backdrop-blur-sm overflow-hidden">
            <svg width="140" height="90" viewBox="0 0 2000 1000">
              {nodes.map((n) => {
                const template = nodeTemplates.find((t) => t.type === n.type);
                return (
                  <rect
                    key={n.id}
                    x={n.x}
                    y={n.y}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx="4"
                    fill={template?.bg || "var(--secondary)"}
                    stroke={selectedNode === n.id ? "var(--primary)" : "var(--border)"}
                    strokeWidth={selectedNode === n.id ? 6 : 2}
                  />
                );
              })}
              {connections.map((conn) => {
                const from = getNodeCenter(conn.from, conn.fromPort);
                const to = getNodeCenter(conn.to, "input");
                return (
                  <line
                    key={conn.id}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="var(--muted-foreground)"
                    strokeWidth="2"
                    opacity="0.3"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Config Panel (Right Side) */}
        {showConfigPanel && selectedNodeData && selectedTemplate && (
          <div className="w-[280px] border-l border-border bg-card overflow-y-auto flex-shrink-0">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: selectedTemplate.bg }}>
                  {(() => { const Icon = selectedTemplate.icon; return <Icon className="w-3.5 h-3.5" style={{ color: selectedTemplate.color }} />; })()}
                </div>
                <span className="text-xs" style={{ fontWeight: 600 }}>Configure Node</span>
              </div>
              <button onClick={() => setShowConfigPanel(false)} className="p-0.5 rounded hover:bg-secondary transition-colors">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>

            <div className="p-3 space-y-3">
              {/* Node Label */}
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Label</label>
                <input
                  value={selectedNodeData.label}
                  onChange={(e) =>
                    setNodes((prev) => prev.map((n) => (n.id === selectedNode ? { ...n, label: e.target.value } : n)))
                  }
                  className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Type</label>
                <div className="text-[11px] px-2.5 py-1.5 bg-secondary rounded-md" style={{ fontWeight: 500 }}>
                  {selectedTemplate.label}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Status</label>
                <span
                  className="text-[10px] px-2 py-0.5 rounded capitalize"
                  style={{
                    fontWeight: 500,
                    backgroundColor:
                      selectedNodeData.status === "success" ? "rgba(0,200,83,0.1)" :
                      selectedNodeData.status === "running" ? "rgba(255,152,0,0.1)" :
                      selectedNodeData.status === "error" ? "rgba(244,67,54,0.1)" :
                      "var(--secondary)",
                    color:
                      selectedNodeData.status === "success" ? "#00C853" :
                      selectedNodeData.status === "running" ? "#FF9800" :
                      selectedNodeData.status === "error" ? "#F44336" :
                      "var(--muted-foreground)",
                  }}
                >
                  {selectedNodeData.status || "idle"}
                </span>
              </div>

              {/* Type-specific config */}
              {selectedNodeData.type === "trigger" && (
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Event</label>
                    <select className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none cursor-pointer">
                      <option>lead.created</option>
                      <option>deal.updated</option>
                      <option>contact.created</option>
                      <option>health_score.changed</option>
                      <option>ticket.created</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Source</label>
                    <select className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none cursor-pointer">
                      <option>Salesforce</option>
                      <option>HubSpot</option>
                      <option>Stripe</option>
                      <option>Intercom</option>
                    </select>
                  </div>
                </>
              )}

              {selectedNodeData.type === "condition" && (
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Field</label>
                    <input
                      defaultValue={selectedNodeData.config.field || ""}
                      className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g., region"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Operator</label>
                    <select className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none cursor-pointer">
                      <option>equals</option>
                      <option>not equals</option>
                      <option>contains</option>
                      <option>greater than</option>
                      <option>less than</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Value</label>
                    <input
                      defaultValue={selectedNodeData.config.value || ""}
                      className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g., APAC"
                    />
                  </div>
                </>
              )}

              {selectedNodeData.type === "email" && (
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Template</label>
                    <select className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none cursor-pointer">
                      <option>welcome_lead</option>
                      <option>follow_up</option>
                      <option>renewal_reminder</option>
                      <option>onboarding</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Subject</label>
                    <input
                      defaultValue={selectedNodeData.config.subject || ""}
                      className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Email subject"
                    />
                  </div>
                </>
              )}

              {selectedNodeData.type === "slack" && (
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Channel</label>
                    <input
                      defaultValue={selectedNodeData.config.channel || ""}
                      className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="#channel-name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Message</label>
                    <textarea
                      defaultValue={selectedNodeData.config.message || ""}
                      className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none focus:ring-2 focus:ring-primary/20 resize-none h-16"
                      placeholder="Message template..."
                    />
                  </div>
                </>
              )}

              {selectedNodeData.type === "ai_agent" && (
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Model</label>
                    <select className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none cursor-pointer">
                      <option>gpt-4</option>
                      <option>gpt-4-turbo</option>
                      <option>claude-3-opus</option>
                      <option>custom (BYOM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Prompt</label>
                    <textarea
                      defaultValue={selectedNodeData.config.prompt || ""}
                      className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none focus:ring-2 focus:ring-primary/20 resize-none h-20"
                      placeholder="AI instruction..."
                    />
                  </div>
                </>
              )}

              {selectedNodeData.type === "delay" && (
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Duration</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        defaultValue="5"
                        className="flex-1 px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <select className="px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none cursor-pointer">
                        <option>minutes</option>
                        <option>hours</option>
                        <option>days</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {selectedNodeData.type === "approval" && (
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Approvers</label>
                    <select className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none cursor-pointer">
                      <option>Admin (Arun Kumar)</option>
                      <option>Ops Manager (Priya Sharma)</option>
                      <option>Auto-approve if policy passes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Timeout</label>
                    <select className="w-full px-2.5 py-1.5 bg-secondary rounded-md text-xs border-none outline-none cursor-pointer">
                      <option>24 hours</option>
                      <option>48 hours</option>
                      <option>7 days</option>
                      <option>No timeout</option>
                    </select>
                  </div>
                </>
              )}

              {/* Connections */}
              <div className="pt-2 border-t border-border">
                <label className="text-[10px] text-muted-foreground mb-1.5 block uppercase tracking-wider" style={{ fontWeight: 500 }}>Connections</label>
                {connections.filter((c) => c.from === selectedNode || c.to === selectedNode).length === 0 ? (
                  <div className="text-[10px] text-muted-foreground italic">No connections</div>
                ) : (
                  <div className="space-y-1">
                    {connections
                      .filter((c) => c.from === selectedNode || c.to === selectedNode)
                      .map((c) => {
                        const otherNodeId = c.from === selectedNode ? c.to : c.from;
                        const otherNode = nodes.find((n) => n.id === otherNodeId);
                        const direction = c.from === selectedNode ? "→" : "←";
                        return (
                          <div key={c.id} className="flex items-center justify-between text-[10px] px-2 py-1 rounded bg-secondary/50">
                            <span>
                              {direction} {otherNode?.label || "Unknown"}
                              {c.label && <span className="text-muted-foreground ml-1">({c.label})</span>}
                            </span>
                            <button
                              onClick={() => deleteConnection(c.id)}
                              className="p-0.5 rounded hover:bg-secondary transition-colors"
                            >
                              <X className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Delete Node */}
              <button
                onClick={() => deleteNode(selectedNodeData.id)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-[var(--iw-danger)]/30 text-[var(--iw-danger)] text-xs hover:bg-[var(--iw-danger)]/10 transition-colors mt-3"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Node
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
