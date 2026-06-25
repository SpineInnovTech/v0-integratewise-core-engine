/**
 * MemoryProposeForm — Propose new memory items
 *
 * Calls memory.propose via gateway → MCP layer.
 * NEVER writes directly to org_memory.
 *
 * Phase 8 Task 34
 * Requirements: 9.2
 */

import React, { useState } from "react";

const MEMORY_TYPES = ["decision", "outcome", "learning", "context", "policy", "entity"] as const;

interface MemoryProposeFormProps {
  tenantId: string;
  domain?: string;
}

export function MemoryProposeForm({ tenantId, domain }: MemoryProposeFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<string>("learning");
  const [evidenceRefs, setEvidenceRefs] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/v1/memory/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          title: title.trim(),
          content: body.trim(),
          category: type,
          domain: domain || "cross_data",
          evidence_refs: evidenceRefs.split(",").map((r) => r.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        setResult({ success: true, message: "Memory proposal submitted for governance review." });
        setTitle("");
        setBody("");
        setEvidenceRefs("");
      } else {
        const err = await res.json();
        setResult({ success: false, message: err.error || "Submission failed" });
      }
    } catch (err) {
      setResult({ success: false, message: String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="memory-propose-form" onSubmit={handleSubmit}>
      <h2>Propose to Memory</h2>
      <p className="note">Proposals are routed through governance — never written directly.</p>

      <label>
        Title
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <label>
        Content
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} required />
      </label>

      <label>
        Type
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {MEMORY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>

      <label>
        Evidence References (comma-separated fact IDs)
        <input type="text" value={evidenceRefs} onChange={(e) => setEvidenceRefs(e.target.value)} placeholder="fact-001, fact-002" />
      </label>

      <button type="submit" disabled={submitting || !title.trim() || !body.trim()}>
        {submitting ? "Submitting..." : "Submit Proposal"}
      </button>

      {result && (
        <div className={`result ${result.success ? "success" : "error"}`}>
          {result.message}
        </div>
      )}
    </form>
  );
}
