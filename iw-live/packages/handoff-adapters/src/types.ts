/**
 * Handoff Adapter Interface
 *
 * All adapters (JSON, MCP, OpenClaw, LangGraph, Zapier, n8n)
 * implement this interface.
 */

import type { HandoffPackage } from "@integratewise/types/handoff";

export interface DispatchTarget {
  mode: "download" | "endpoint";
  url?: string;
}

export interface DispatchResult {
  kind: "download" | "endpoint";
  filename?: string;
  body?: string;
  status?: number;
  dispatched_at?: string;
}

export interface HandoffAdapter {
  name: string;
  serialize(pkg: HandoffPackage): string;
  dispatch(pkg: HandoffPackage, target: DispatchTarget): Promise<DispatchResult>;
}
