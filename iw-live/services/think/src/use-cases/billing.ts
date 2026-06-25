import { neon } from "@neondatabase/serverless";

export async function computeBillingSignals(
  databaseUrl: string,
  tenantId: string,
  accountId: string
) {
  const sql = neon(databaseUrl);

  // 1. Fetch recent payment failures
  const recentFailures = await sql`
    SELECT * FROM events 
    WHERE tenant_id = ${tenantId}::uuid 
    AND entity_type = 'account' 
    AND entity_id = ${accountId}
    AND event_type = 'billing.payment_failed'
    AND created_at > NOW() - INTERVAL '30 days'
  `;

  const failureCount = recentFailures.length;
  if (failureCount === 0) return null;

  const band = failureCount > 2 ? "critical" : "warning";

  // 2. Create Evidence Reference (Structured A-plane)
  const evidenceRefs = await Promise.all(
    recentFailures.map((ev) => {
      return sql`
      INSERT INTO evidence_refs (tenant_id, source_plane, source_type, source_id, tool_name, display_label)
      VALUES (${tenantId}::uuid, 'structured', 'event', ${ev.id}, ${ev.source_system}, 'Payment Failure Event')
      RETURNING id
    `;
    })
  );

  const refIds = evidenceRefs.map((r) => r[0].id);

  // 3. Create Signal
  const [signal] = await sql`
    INSERT INTO signals (
      tenant_id, signal_key, entity_type, entity_id, 
      metric_value, metric_unit, band, evidence_ref_ids
    )
    VALUES (
      ${tenantId}::uuid, 'billing.payment_failed', 'account', ${accountId}, 
      ${failureCount}, 'count', ${band}, ${refIds}
    )
    RETURNING *
  `;

  return signal;
}

export async function buildBillingSituation(databaseUrl: string, signal: any) {
  const sql = neon(databaseUrl);
  const { tenant_id, entity_id, id: signal_id } = signal;

  // 1. Search Knowledge (B-Plane)
  // Mocking the call to knowledge worker for now as requested
  const [bEvidence] = await sql`
    INSERT INTO evidence_refs (tenant_id, source_plane, source_type, source_id, display_label)
    VALUES (${tenant_id}::uuid, 'unstructured', 'file_embedding', ${crypto.randomUUID()}, 'Billing Leniency Policy')
    RETURNING id
  `;

  // 2. Search Memories (C-Plane)
  const memories = await sql`
    SELECT * FROM ai_session_memories 
    WHERE tenant_id = ${tenant_id}::uuid 
    AND related_entity_id = ${entity_id}
    AND (text ILIKE '%grace%' OR text ILIKE '%billing%')
    LIMIT 2
  `;

  const cEvidenceRefs = await Promise.all(
    memories.map((m) => {
      return sql`
        INSERT INTO evidence_refs (tenant_id, source_plane, source_type, source_id, tool_name, display_label)
        VALUES (${tenant_id}::uuid, 'chat', 'session_memory', ${m.memory_id}, 'Assistant', 'Memory: ' || LEFT(${m.text}, 30))
        RETURNING id
      `;
    })
  );

  const allEvidenceIds = [
    bEvidence.id,
    ...cEvidenceRefs.map((r) => r[0].id),
    ...signal.evidence_ref_ids,
  ];

  // 3. Create Situation
  const [situation] = await sql`
    INSERT INTO situations (tenant_id, situation_key, signal_ids, title, summary, severity, evidence_ref_ids)
    VALUES (
      ${tenant_id}::uuid, 'billing.at_risk', ARRAY[${signal_id}]::uuid[], 
      'Payment Failure - Account At Risk', 
      'Account has ' || ${signal.metric_value} || ' payment failures. Leniency policy found.', 
      ${signal.band === "critical" ? "high" : "medium"},
      ${allEvidenceIds}
    )
    RETURNING *
  `;

  // 4. Generate Proposals
  await sql`
    INSERT INTO action_proposals (tenant_id, situation_id, proposal_rank, action_type, autonomy_level, confidence_score, parameters)
    VALUES (
      ${tenant_id}::uuid, ${situation.id}, 1, 'billing.apply_grace_period', 'manual', 0.95, 
      ${JSON.stringify({ days: 7, reason: "Leniency policy match" })}
    )
  `;

  await sql`
    INSERT INTO action_proposals (tenant_id, situation_id, proposal_rank, action_type, autonomy_level, confidence_score, parameters)
    VALUES (
      ${tenant_id}::uuid, ${situation.id}, 2, 'crm.create_task', 'auto', 0.85, 
      ${JSON.stringify({ title: "Follow up on payment failure", due_in_days: 1 })}
    )
  `;

  return situation;
}
