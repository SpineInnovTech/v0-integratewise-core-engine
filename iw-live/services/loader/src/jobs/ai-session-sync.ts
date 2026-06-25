// import { neon } from '@neondatabase/serverless'; // Removed for D1

export async function runAiSessionSync(env: any, log: any) {
  const firestoreProjectId = env.FIRESTORE_PROJECT_ID;
  // const dbUrl = env.DATABASE_URL;
  // const sql = neon(dbUrl);

  log.info("Starting AI Session Sync job");

  try {
    // 1. Fetch sessions from Firestore
    // Note: In a production scenario, you'd use a filter for changes since last_sync
    const sessionsUrl = `https://firestore.googleapis.com/v1/projects/${firestoreProjectId}/databases/(default)/documents/ai_sessions`;
    const sessionsResponse = await fetch(sessionsUrl);

    if (!sessionsResponse.ok) {
      throw new Error(`Failed to fetch sessions: ${sessionsResponse.statusText}`);
    }

    const { documents: sessionDocs } = (await sessionsResponse.json()) as any;
    if (!sessionDocs || sessionDocs.length === 0) {
      log.info("No sessions found to sync");
      return;
    }

    // 2. Process each session
    for (const doc of sessionDocs) {
      const fields = doc.fields;
      const tenant_id = fields.tenant_id.stringValue;
      const session_id = fields.session_id.stringValue;

      log.info(`Syncing session ${session_id} for tenant ${tenant_id}`);

      // Upsert session into Neon
      // Upsert session into D1
      await env.DB.prepare(
        `
        INSERT INTO ai_sessions (
          tenant_id, session_id, tool_source, user_label, summary, 
          started_at, ended_at, created_at, scoring_source_trust_level, version
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        )
        ON CONFLICT (tenant_id, session_id) DO UPDATE SET
          summary = excluded.summary,
          user_label = excluded.user_label,
          ended_at = excluded.ended_at,
          scoring_source_trust_level = excluded.scoring_source_trust_level
      `
      )
        .bind(
          tenant_id,
          session_id,
          fields.tool_source.stringValue,
          fields.user_label?.stringValue || null,
          fields.summary.stringValue,
          fields.started_at.timestampValue,
          fields.ended_at.timestampValue,
          fields.created_at.timestampValue,
          fields.scoring_source_trust_level.stringValue,
          fields.version.stringValue
        )
        .run();

      // 3. Fetch memories for this session
      // In Firestore, these are separate docs with IDs like tenant::session::index
      // For simplicity, we query the collection for memories matching this tenant/session
      const memoriesUrl = `https://firestore.googleapis.com/v1/projects/${firestoreProjectId}/databases/(default)/documents/ai_session_memories`;
      // Note: Ideal would be structuredQuery or specific document range
      const memoriesResponse = await fetch(memoriesUrl);
      const { documents: memoryDocs } = (await memoriesResponse.json()) as any;

      if (memoryDocs) {
        for (const mDoc of memoryDocs) {
          const mFields = mDoc.fields;
          if (
            mFields.tenant_id.stringValue === tenant_id &&
            mFields.session_id.stringValue === session_id
          ) {
            const memory_id = mDoc.name.split("/").pop();

            await env.DB.prepare(
              `
              INSERT INTO ai_session_memories (
                tenant_id, session_id, memory_id, memory_type, 
                related_entity_type, related_entity_id, text, confidence_score, 
                scoring_source_trust_level, source_turn_ids, created_at,
                confirmed_by, confirmed_at
              ) VALUES (
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?
              )
              ON CONFLICT (tenant_id, session_id, memory_id) DO UPDATE SET
                scoring_source_trust_level = excluded.scoring_source_trust_level,
                confirmed_by = excluded.confirmed_by,
                confirmed_at = excluded.confirmed_at
            `
            )
              .bind(
                tenant_id,
                session_id,
                memory_id,
                mFields.memory_type.stringValue,
                mFields.related_entity_type?.stringValue || null,
                mFields.related_entity_id?.stringValue || null,
                mFields.text.stringValue,
                mFields.confidence_score?.doubleValue || 0.7,
                mFields.scoring_source_trust_level.stringValue,
                JSON.stringify(
                  mFields.source_turn_ids?.arrayValue?.values?.map((v: any) => v.stringValue) || []
                ),
                mFields.created_at.timestampValue,
                mFields.confirmed_by?.stringValue || null,
                mFields.confirmed_at?.timestampValue || null
              )
              .run();

            // Part 3.3: Generate embeddings for memory content
            await generateEmbeddings(env, tenant_id, session_id, mFields.text.stringValue, log);
          }
        }
      }
    }

    log.info("AI Session Sync job completed successfully");
  } catch (error: any) {
    log.error("AI Session Sync job failed", { error: error.message });
    throw error;
  }
}

/**
 * Part 3.3: Generate embeddings for AI session content via Knowledge service
 */
async function generateEmbeddings(
  env: any,
  tenantId: string,
  sessionId: string,
  content: string,
  log: any
) {
  try {
    // Route to Knowledge service which handles embeddings via pgVector
    if (!env.KNOWLEDGE) {
      log.warn("KNOWLEDGE service binding not available, skipping embeddings");
      return null;
    }

    const res = await env.KNOWLEDGE.fetch(
      new Request("http://knowledge/v1/knowledge/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          text: content,
          source_type: "ai_session",
          source_id: sessionId,
        }),
      })
    );

    if (res && res.ok) {
      const result = await res.json();
      log.info(`[Loader] Embeddings generated for session ${sessionId}`);
      return result;
    } else {
      log.warn(`[Loader] Embedding generation returned status ${res?.status || "unknown"}`);
    }
  } catch (err) {
    log.error(`[Loader] Embedding generation failed for session ${sessionId}:`, {
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return null;
}
