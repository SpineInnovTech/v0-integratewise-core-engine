/**
 * IW Continuity Bridge Dashboard
 *
 * The product surface. Shows:
 * - AI client connections (Claude, ChatGPT, etc.)
 * - Spine health (entity count, memory count, sync status)
 * - Connected sources (via Nango)
 * - Install snippet (JSON copy-paste for MCP clients)
 * - Recent queries (what your AI asked)
 * - Memory growth (compounding knowledge)
 */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/core/auth/auth-provider";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const MCP_URL = "https://mcp.integratewise.ai";

interface SpineHealth {
  entities: number;
  memory: number;
  signals: number;
  sources: number;
  lastSync: string;
  queriestoday: number;
}

interface ConnectedSource {
  provider: string;
  status: "connected" | "syncing" | "error";
  lastSync: string;
}

export function BridgeDashboard() {
  const { accessToken, user } = useAuth();
  const [health, setHealth] = useState<SpineHealth | null>(null);
  const [sources, setSources] = useState<ConnectedSource[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!accessToken || !API_BASE) return;

    // Fetch spine health
    fetch(`${API_BASE}/api/v1/projections/morning-context`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setHealth({
          entities: data.entities?.length || 0,
          memory: data.memory?.count || 0,
          signals: data.signals?.length || 0,
          sources: data.connectors?.length || 0,
          lastSync: data.lastSync || "Never",
          queriestoday: data.queries || 0,
        });
      })
      .catch(() => {});

    // Fetch connector status
    fetch(`${API_BASE}/api/v1/connector/list`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setSources(data.connectors || data.data || []);
      })
      .catch(() => {});
  }, [accessToken]);

  const installSnippet = JSON.stringify(
    {
      mcpServers: {
        integratewise: {
          url: `${MCP_URL}/mcp`,
          headers: {
            Authorization: `Bearer ${accessToken || "<your-token>"}`,
            "x-tenant-id": user?.tenant_id || "<your-tenant-id>",
          },
        },
      },
    },
    null,
    2
  );

  const copySnippet = () => {
    navigator.clipboard.writeText(installSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--iw-forest)", fontFamily: "var(--font-serif, Georgia, serif)" }}
        >
          IW Continuity Bridge
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--iw-ink-muted, #6B6556)" }}>
          Connect once. Your AI reads from operational truth.
        </p>
      </div>

      {/* Spine Health */}
      <section>
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--iw-ink-faint, #9B9484)" }}
        >
          Spine Health
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Entities", value: health?.entities || 0 },
            { label: "Memory", value: health?.memory || 0 },
            { label: "Signals", value: health?.signals || 0 },
            { label: "Sources", value: health?.sources || 0 },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="p-4 rounded-lg border"
              style={{
                background: "var(--iw-paper-warm, #EBE5D8)",
                borderColor: "var(--iw-border, #D4CDB8)",
              }}
            >
              <div className="text-2xl font-bold" style={{ color: "var(--iw-forest)" }}>
                {value}
              </div>
              <div className="text-xs" style={{ color: "var(--iw-ink-muted)" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Connected Sources */}
      <section>
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--iw-ink-faint)" }}
        >
          Connected Sources
        </h2>
        <div className="flex flex-wrap gap-2">
          {sources.length > 0 ? (
            sources.map((s) => (
              <div
                key={s.provider}
                className="px-3 py-2 rounded-md border text-sm flex items-center gap-2"
                style={{ borderColor: "var(--iw-border)", background: "var(--iw-paper-warm)" }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background:
                      s.status === "connected"
                        ? "var(--iw-green, #2D5A3D)"
                        : s.status === "syncing"
                          ? "var(--iw-gold, #B8943F)"
                          : "var(--iw-red, #8B2020)",
                  }}
                />
                <span style={{ color: "var(--iw-ink)" }}>{s.provider}</span>
              </div>
            ))
          ) : (
            <p className="text-sm" style={{ color: "var(--iw-ink-muted)" }}>
              No sources connected yet. Go to /connectors to add your first tool.
            </p>
          )}
        </div>
      </section>

      {/* Install Snippet */}
      <section>
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--iw-ink-faint)" }}
        >
          Connect Your AI
        </h2>
        <p className="text-sm mb-3" style={{ color: "var(--iw-ink-muted)" }}>
          Add this to your Claude Desktop, ChatGPT, or any MCP client config:
        </p>
        <div className="relative">
          <pre
            className="p-4 rounded-lg text-xs overflow-x-auto"
            style={{
              background: "var(--iw-forest-deep, #0E2016)",
              color: "var(--iw-paper, #F4F0E8)",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {installSnippet}
          </pre>
          <button
            onClick={copySnippet}
            className="absolute top-3 right-3 px-3 py-1 rounded text-xs"
            style={{
              background: copied ? "var(--iw-green)" : "var(--iw-gold)",
              color: "var(--iw-forest-deep)",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section>
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--iw-ink-faint)" }}
        >
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              title: "Connect Tools",
              desc: "OAuth your SaaS tools via /connectors. Nango handles tokens.",
            },
            {
              step: "2",
              title: "Spine Normalizes",
              desc: "8-stage pipeline erases source identity. One truth.",
            },
            {
              step: "3",
              title: "AI Reads Spine",
              desc: "Your AI reads from governed truth. Memory compounds.",
            },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              className="p-4 rounded-lg border"
              style={{ borderColor: "var(--iw-border)", background: "var(--iw-paper)" }}
            >
              <div className="text-xs font-bold mb-1" style={{ color: "var(--iw-gold)" }}>
                STEP {step}
              </div>
              <div className="font-semibold text-sm mb-1" style={{ color: "var(--iw-forest)" }}>
                {title}
              </div>
              <div className="text-xs" style={{ color: "var(--iw-ink-muted)" }}>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default BridgeDashboard;
