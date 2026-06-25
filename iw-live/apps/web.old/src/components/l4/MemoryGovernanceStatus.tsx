/**
 * MemoryGovernanceStatus — Real-time governance state per memory item
 *
 * Shows staging / pending / approved / rejected status.
 *
 * Phase 8 Task 35
 * Requirements: 9.3
 */

import React, { useState, useEffect } from "react";

interface MemoryItem {
  id: string;
  title: string;
  category: string;
  governance_state: "staging" | "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

interface Props {
  tenantId: string;
  filter: "pending" | "approved" | "rejected" | "all";
}

export function MemoryGovernanceStatus({ tenantId, filter }: Props) {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/v1/memory/list?tenant_id=${tenantId}&governance_state=${filter}`
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
    // Poll every 10s for real-time updates
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [tenantId, filter]);

  if (loading) return <div>Loading...</div>;

  const stateColors: Record<string, string> = {
    staging: "#f59e0b",
    pending: "#3b82f6",
    approved: "#10b981",
    rejected: "#ef4444",
  };

  return (
    <div className="memory-governance-status">
      <h2>{filter === "approved" ? "Promoted Memory" : "Pending Review"}</h2>
      {items.length === 0 ? (
        <p>No items in this state.</p>
      ) : (
        <ul className="memory-list">
          {items.map((item) => (
            <li key={item.id} className="memory-item">
              <span className="title">{item.title}</span>
              <span className="category">{item.category}</span>
              <span
                className="governance-badge"
                style={{ backgroundColor: stateColors[item.governance_state] || "#6b7280" }}
              >
                {item.governance_state}
              </span>
              <span className="timestamp">{new Date(item.updated_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
