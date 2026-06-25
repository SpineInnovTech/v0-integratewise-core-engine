/**
 * Outbox pattern for reliable event delivery.
 * @integratewise/os - Reliability
 */

import { query } from "@/lib/neon"
import { log } from "@/lib/logger"

export interface OutboxEvent {
  id: string
  event_type: string
  payload: Record<string, unknown>
  status: "pending" | "processing" | "completed" | "failed"
  attempts: number
  created_at: string
  processed_at?: string
}

export async function enqueueEvent(
  eventType: string,
  payload: Record<string, unknown>,
  requestId?: string,
): Promise<string> {
  const id = crypto.randomUUID()

  await query(
    `INSERT INTO outbox_events (id, event_type, payload, status, attempts, created_at)
     VALUES ($1, $2, $3, 'pending', 0, NOW())`,
    [id, eventType, JSON.stringify(payload)],
    requestId,
  )

  await log("info", "outbox_enqueue", { id, eventType }, requestId)
  return id
}

export async function processPendingEvents(
  batchSize = 10,
  requestId?: string,
): Promise<{ processed: number; failed: number }> {
  const events = await query<OutboxEvent>(
    `SELECT * FROM outbox_events
     WHERE status IN ('pending', 'failed')
     AND attempts < 5
     ORDER BY created_at ASC
     LIMIT $1
     FOR UPDATE SKIP LOCKED`,
    [batchSize],
    requestId,
  )

  let processed = 0
  let failed = 0

  for (const event of events) {
    try {
      // Mark as processing
      await query(
        `UPDATE outbox_events SET status = 'processing', attempts = attempts + 1 WHERE id = $1`,
        [event.id],
        requestId,
      )

      // Process the event (implement your handlers here)
      await processEvent(event, requestId)

      // Mark as completed
      await query(
        `UPDATE outbox_events SET status = 'completed', processed_at = NOW() WHERE id = $1`,
        [event.id],
        requestId,
      )

      processed++
    } catch (error: any) {
      await log(
        "error",
        "outbox_process_error",
        {
          eventId: event.id,
          error: error?.message,
        },
        requestId,
      )

      await query(`UPDATE outbox_events SET status = 'failed' WHERE id = $1`, [event.id], requestId)

      failed++
    }
  }

  return { processed, failed }
}

async function processEvent(event: OutboxEvent, requestId?: string): Promise<void> {
  // Route to appropriate handler based on event type
  switch (event.event_type) {
    case "webhook_delivery":
      // Handle webhook delivery
      break
    case "email_send":
      // Handle email sending
      break
    case "sync_data":
      // Handle data sync
      break
    default:
      await log("warn", "outbox_unknown_event", { eventType: event.event_type }, requestId)
  }
}
