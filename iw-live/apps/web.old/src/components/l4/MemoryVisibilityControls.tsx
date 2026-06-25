/**
 * MemoryVisibilityControls — Domain scoping and sharing
 *
 * Manage visibility, flag for re-review, cross-domain access.
 *
 * Phase 8 Task 37
 * Requirements: 9.6, 9.7
 */

import React, { useState, useEffect } from "react";

interface MemoryVisibilityItem {
  id: string;
  title: string;
  domain: string;
  visibility: "private" | "domain" | "cross_domain";
  flagged_for_review: boolean;
}

interface Props {
  tenantId: string;
  domain?: string;
}

export function MemoryVisibilityControls({ tenantId, domain }: Props) {
  const [items, setItems] = useState<MemoryVisibilityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/v1/memory/visibility?tenant_id=${tenantId}&domain=${domain || "all"}`
        );
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenantId, domain]);

  async function toggleVisibility(id: string, newVisibility: string) {
    await fetch(`/api/v1/memory/${id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, visibility: newVisibility }),
    });
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, visibility: newVisibility as any } : item))
    );
  }

  async function flagForReview(id: string) {
    await fetch(`/api/v1/memory/${id}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, action: "flag_for_review" }),
    });
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, flagged_for_review: true } : item))
    );
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="memory-visibility">
      <h2>Memory Visibility & Scoping</h2>
      {items.length === 0 ? (
        <p>No memory items to manage.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Title</th><th>Domain</th><th>Visibility</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.domain}</td>
                <td>
                  <select
                    value={item.visibility}
                    onChange={(e) => toggleVisibility(item.id, e.target.value)}
                  >
                    <option value="private">Private</option>
                    <option value="domain">Domain Only</option>
                    <option value="cross_domain">Cross-Domain</option>
                  </select>
                </td>
                <td>
                  {!item.flagged_for_review ? (
                    <button onClick={() => flagForReview(item.id)}>Flag for Re-Review</button>
                  ) : (
                    <span className="flagged">🚩 Flagged</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
