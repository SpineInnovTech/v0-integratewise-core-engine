"use client";

import React, { useState, useEffect } from "react";
import "./bridge.css";
import { getSituations, decideAction, triggerAnalysis, Situation, Proposal } from "./api";

interface BridgeProps {
  onNavigate?: (page: any) => void;
}

const FiberLine: React.FC<{
  start: [number, number];
  end: [number, number];
  color: string;
  delay: number;
}> = ({ start, end, color, delay }) => {
  const midY = (start[1] + end[1]) / 2;
  const path = `M ${start[0]} ${start[1]} C ${start[0]} ${midY}, ${end[0]} ${midY}, ${end[0]} ${end[1]}`;

  return (
    <svg
      className="fiber fiber-pulse"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        animationDelay: `${delay}s`,
      }}
    >
      <path
        d={path}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
      />
    </svg>
  );
};

const MemoryNodes: React.FC = () => {
  const nodes = [
    { x: 100, y: 50, label: "Accounts" },
    { x: 180, y: 80, label: "Tickets" },
    { x: 50, y: 120, label: "Risks" },
    { x: 220, y: 140, label: "Themes" },
    { x: 130, y: 160, label: "ROI" },
  ];

  return (
    <div className="relative w-full h-48 overflow-visible">
      <svg width="100%" height="100%" viewBox="0 0 300 200">
        {nodes.map((node, i) => (
          <React.Fragment key={i}>
            {nodes.slice(i + 1).map((target, j) => (
              <line
                key={`${i}-${j}`}
                x1={node.x}
                y1={node.y}
                x2={target.x}
                y2={target.y}
                stroke="rgba(61, 122, 80, 0.2)"
                strokeWidth="1"
              />
            ))}
            <circle cx={node.x} cy={node.y} r="4" className="node-circle" fill="#3d7a50" />
            <text x={node.x + 8} y={node.y + 4} fontSize="8" fill="#4A4640" fontWeight="600">
              {node.label}
            </text>
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
};

const BridgeControlPanel: React.FC<BridgeProps> = ({ onNavigate }) => {
  const [autonomyMode, setAutonomyMode] = useState<"manual" | "assisted" | "autonomous">(
    "assisted"
  );
  const [isMounted, setIsMounted] = useState(false);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [selectedSit, setSelectedSit] = useState<Situation | null>(null);

  useEffect(() => {
    setIsMounted(true);
    loadSituations();
  }, []);

  const loadSituations = async () => {
    try {
      const items = await getSituations();
      setSituations(items || []);
    } catch (e) {
      console.error("Failed to load situations");
    }
  };

  const triggerAnalyze = async () => {
    const TENANT_ID = "11111111-1111-1111-1111-111111111111";
    try {
      await fetch("http://localhost:8791/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: TENANT_ID, intent: "Analyze all domains" }),
      });
      loadSituations();
    } catch (e) {
      console.error("Analysis trigger failed");
    }
  };

  const handleProposalDecision = async (proposalId: string, decision: "approve" | "reject") => {
    await decideAction(proposalId, decision);
    loadSituations();
  };

  return (
    <div className="bridge-container">
      <div className="abstract-grid" />
      <div className="cockpit-surface" />

      {/* Top Controls */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 p-2 bg-white/80 backdrop-blur-md rounded-full border border-white/40 shadow-xl">
        <div
          className="flex px-4 items-center gap-2 border-r border-gray-200 cursor-pointer group"
          onClick={triggerAnalyze}
        >
          <div className="w-8 h-8 rounded bg-cloud-burst flex items-center justify-center text-white font-bold text-xs ring-2 ring-white group-hover:scale-110 transition-transform">
            SCAN
          </div>
          <span className="text-sm font-bold text-cloud-burst">Analyze All Units</span>
        </div>

        <div className="flex bg-athens-gray/50 p-1 rounded-full border border-gray-100">
          {["manual", "assisted", "autonomous"].map((mode) => (
            <button
              key={mode}
              onClick={() => setAutonomyMode(mode as any)}
              className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                autonomyMode === mode
                  ? "bg-cloud-burst text-white shadow-lg scale-105"
                  : "text-secondary hover:bg-gray-200"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-cloud-burst">System Secure</p>
            <p className="text-[9px] text-green-500 font-medium">● 100% Signal Integrity</p>
          </div>
        </div>
      </div>

      {/* Floating Panels Grid */}
      <div className="relative z-10 grid grid-cols-12 gap-6 mt-16 max-w-7xl mx-auto h-full">
        {/* Left: Spine - Truth */}
        <div
          className="col-span-12 lg:col-span-4 floating-panel p-6 flex flex-col gap-4 animate-magnet-pin"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-widest text-cloud-burst">
              01 Spine // Truth
            </h2>
            <span className="text-[10px] font-bold text-teal-500 px-2 py-0.5 bg-teal-50 rounded">
              RAW DATA
            </span>
          </div>
          <div className="space-y-3">
            {[
              { name: "Acme Corp", health: 85, status: "champion", arr: "$1.2M" },
              { name: "Cyberdyne", health: 42, status: "at_risk", arr: "$5.4M" },
              { name: "Stark Ind.", health: 98, status: "champion", arr: "$25M" },
            ].map((org, i) => (
              <div
                key={i}
                className="p-3 bg-white/40 border border-white/60 rounded-lg flex items-center justify-between group hover:bg-white transition-all"
              >
                <div>
                  <p className="text-xs font-bold text-primary">{org.name}</p>
                  <p className="text-[10px] text-secondary">{org.arr} ARR</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[9px] font-black uppercase block ${org.health > 80 ? "text-teal-600" : "text-red-600"}`}
                  >
                    {org.status}
                  </span>
                  <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                    <div
                      className="h-full rounded-full bg-teal-500"
                      style={{ width: `${org.health}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Memory Scatter */}
        <div
          className="col-span-12 lg:col-span-4 floating-panel p-6 flex flex-col gap-4 animate-magnet-pin"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-widest text-cloud-burst">
              02 Memory // Semantic
            </h2>
            <span className="text-[10px] font-bold text-blue-500 px-2 py-0.5 bg-blue-50 rounded">
              Vector DB Active
            </span>
          </div>
          <MemoryNodes />
          <div className="mt-auto space-y-2">
            <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100">
              <p className="text-[10px] font-bold text-blue-800">Knowledge Pulse</p>
              <p className="text-[9px] text-blue-600 italic">
                "Retrieving associated conversation patterns for recent anomalies..."
              </p>
            </div>
          </div>
        </div>

        {/* NEW: Review & Approve Lane */}
        <div
          className="col-span-12 lg:col-span-4 floating-panel p-6 flex flex-col gap-4 animate-magnet-pin"
          style={{ animationDelay: "0.3s", border: "2px solid var(--glow-pink)" }}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-widest text-cloud-burst">
              05 Review & Approve
            </h2>
            <span className="text-[10px] font-bold text-pink-500 px-2 py-0.5 bg-pink-50 rounded italic">
              {situations.length} Pending
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {situations.length === 0 && (
              <p className="text-[10px] text-secondary italic text-center mt-10">
                System Status: Balanced. No review required.
              </p>
            )}
            {situations.map((sit, i) => (
              <div
                key={i}
                onClick={() => setSelectedSit(sit)}
                className="p-3 bg-white border-l-4 border-l-pink-500 rounded shadow-sm hover:translate-x-1 transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-black text-cloud-burst uppercase truncate max-w-[80%]">
                    {sit.label}
                  </p>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-pink-50 text-pink-500">
                    {sit.domain}
                  </span>
                </div>
                <p className="text-[9px] text-secondary mt-1 line-clamp-1">{sit.analysis}</p>

                <div className="mt-3 space-y-1.5">
                  {sit.proposals
                    ?.filter((p: any) => p.status === "pending")
                    .map((prop: any) => (
                      <div
                        key={prop.id}
                        className="p-2 bg-athens-gray/50 rounded flex justify-between items-center group/prop"
                      >
                        <span className="text-[9px] font-bold text-san-marino truncate max-w-[70%]">
                          {prop.description}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover/prop:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProposalDecision(prop.id, "approve");
                            }}
                            className="p-1 bg-green-500 text-white rounded"
                          >
                            <svg
                              className="w-2.5 h-2.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProposalDecision(prop.id, "reject");
                            }}
                            className="p-1 bg-red-500 text-white rounded"
                          >
                            <svg
                              className="w-2.5 h-2.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Drawer */}
        {selectedSit && (
          <div className="absolute inset-x-0 bottom-0 top-1/2 z-[60] bg-white border-t-2 border-pink-500 p-8 shadow-2xl animate-fade-in-up overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-cloud-burst">{selectedSit.label}</h3>
                <p className="text-sm text-secondary mt-1">{selectedSit.analysis}</p>
              </div>
              <button
                onClick={() => setSelectedSit(null)}
                className="text-secondary hover:text-cloud-burst"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-athens-gray/30 p-4 rounded-xl border border-gray-100">
                <h4 className="text-[10px] font-black uppercase text-secondary mb-4 tracking-widest">
                  Flow A Evidence // Truth
                </h4>
                <div className="space-y-4">
                  {selectedSit.evidence.flow_a?.map((id: string) => (
                    <div key={id} className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs font-bold text-cloud-burst">{id}</p>
                      <p className="text-[10px] text-secondary">
                        Structured Entity Reference Detected
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-athens-gray/30 p-4 rounded-xl border border-gray-100">
                <h4 className="text-[10px] font-black uppercase text-secondary mb-4 tracking-widest">
                  Flow B Evidence // Memory
                </h4>
                <div className="space-y-4">
                  {selectedSit.evidence.flow_b?.map((id: string) => (
                    <div
                      key={id}
                      className="p-3 bg-white rounded-lg border border-blue-200 italic text-[11px] text-blue-900 border-l-4"
                    >
                      "{id} / Document Pointer Linked"
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Bottom Panel: Act & Autonomy */}
        <div
          className="col-span-12 lg:col-span-12 floating-panel p-6 flex flex-col gap-4 animate-magnet-pin mt-6"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-widest text-cloud-burst">
              04 Act // Motion
            </h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                <span className="text-[9px] font-extrabold text-pink-600 uppercase">
                  IQ Hub: Applying Domain Policy
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                tool: "Slack",
                action: "Internal Alert Sent",
                mode: "Autonomous",
                status: "Executed",
                time: "2m ago",
              },
              {
                tool: "Jira",
                action: "Created Critical Issue",
                mode: "Assisted",
                status: "Approved",
                time: "15m ago",
              },
              {
                tool: "HubSpot",
                action: "Update Lifecycle Stage",
                mode: "Policy",
                status: "Proposed",
                time: "1h ago",
              },
              {
                tool: "Intercom",
                action: "User Outreach Triggered",
                mode: "Autonomous",
                status: "Executed",
                time: "3h ago",
              },
            ].map((act, i) => (
              <div
                key={i}
                className="p-3 bg-white/40 border border-white/60 rounded-xl relative overflow-hidden"
              >
                <div className="flex justify-between mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[8px] font-black uppercase text-secondary">
                    {act.tool}
                  </span>
                  <span className="text-[8px] text-gray-400 font-bold">{act.time}</span>
                </div>
                <p className="text-[10px] font-bold text-cloud-burst mb-1">{act.action}</p>
                <div className="flex justify-between items-center mt-3">
                  <span
                    className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                      act.mode === "Autonomous"
                        ? "bg-pink-100 text-pink-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {act.mode}
                  </span>
                  <span className="text-[8px] font-black uppercase text-san-marino">
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Background Bands */}
      <div className="layer-bands">
        <div className="layer-band band-data">
          <span>Data</span>
        </div>
        <div className="layer-band band-memory">
          <span>Memory</span>
        </div>
        <div className="layer-band band-think">
          <span>Think</span>
        </div>
        <div className="layer-band band-act">
          <span>Act</span>
        </div>
      </div>

      {/* SVG Connections (Neural Fibers) */}
      {isMounted && (
        <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden">
          <FiberLine start={[400, 950]} end={[300, 400]} color="var(--glow-teal)" delay={0} />
          <FiberLine start={[600, 950]} end={[400, 420]} color="var(--glow-teal)" delay={0.2} />
          <FiberLine start={[500, 920]} end={[600, 400]} color="var(--glow-blue)" delay={0.5} />
          <FiberLine start={[700, 920]} end={[800, 420]} color="var(--glow-blue)" delay={0.7} />
          <FiberLine start={[450, 890]} end={[500, 600]} color="#b8943f" delay={1.1} />
          <FiberLine start={[850, 890]} end={[700, 600]} color="#b8943f" delay={1.3} />
          <FiberLine start={[300, 860]} end={[400, 800]} color="var(--glow-pink)" delay={1.5} />
          <FiberLine start={[900, 860]} end={[800, 800]} color="var(--glow-pink)" delay={1.7} />
        </div>
      )}

      {/* ROI Widget */}
      <div className="absolute bottom-12 right-12 z-50 floating-panel p-4 w-48 border-l-4 border-l-pink-500">
        <p className="text-[9px] font-black uppercase text-secondary">Operational ROI</p>
        <p className="text-xs font-bold text-cloud-burst mt-1">
          Efficient Workflows & Smarter Decisions
        </p>
        <div className="h-6 w-full bg-pink-50 mt-2 overflow-hidden rounded">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M0 20 L20 15 L40 18 L60 8 L80 12 L100 5 L100 20 Z"
              fill="rgba(246, 74, 138, 0.2)"
            />
            <path
              d="M0 20 L20 15 L40 18 L60 8 L80 12 L100 5"
              fill="none"
              stroke="#b8943f"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default BridgeControlPanel;
