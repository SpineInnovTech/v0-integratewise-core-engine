/**
 * AuditTrail — State transition log viewer
 * Phase 7 Task 30
 * Requirements: 8.6
 */

import React, { useState, useEffect } from "react";

interface AuditEntry {
  from_state: string | null;
  to_state: string;
  actor: string;
  reason: string | null;
  occurred_at: string;
}

interface AuditTrailProps {
  packageId: string;
  tenantId: string;
  onBack: () => void;
}

export function AuditTrail({ packageId, tenantId, onBack }: AuditTrailProps) {
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/handoff/${packageId}/state?tenant_id=${tenantId}`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [packageId]);

  if (loading) return <div>Loading audit trail...</div>;

  return (
    <div className="audit-trail">
      <button onClick={onBack}>← Back</button>
      <h2>Audit Trail — {packageId.slice(0, 8)}...</h2>
      <table>
        <thead>
          <tr><th>From</th><th>To</th><th>Actor</th><th>Reason</th><th>Time</th></tr>
        </thead>
        <tbody>
          {history.map((entry, i) => (
            <tr key={i}>
              <td>{entry.from_state || "—"}</td>
              <td><strong>{entry.to_state}</strong></td>
              <td>{entry.actor}</td>
              <td>{entry.reason || "—"}</td>
              <td>{new Date(entry.occurred_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {history.length === 0 && <p>No transitions recorded yet.</p>}
    </div>
  );
}
