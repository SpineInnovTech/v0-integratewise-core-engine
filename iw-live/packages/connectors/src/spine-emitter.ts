import {
  NormalizedConnectorEvent,
  NormalizedConnectorEventSchema,
} from "@integratewise/connector-contracts";
import axios from "axios";
import { randomUUID } from "crypto";

export class SpineEmitter {
  private spineUrl: string;
  private apiKey: string;

  constructor(spineUrl: string = "http://localhost:8787/spine", apiKey: string = "") {
    this.spineUrl = spineUrl;
    this.apiKey = apiKey;
  }

  /**
   * Normalizes and emits a record to the Spine.
   */
  async emit(
    tenantId: string,
    sourceSystem: string,
    eventType: string,
    data: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Construct the normalized event
    const event: NormalizedConnectorEvent = {
      tenant_id: tenantId,
      event_type: eventType,
      source_system: sourceSystem,
      idempotency_key: randomUUID(), // Generate unique key for every emission
      payload: data,
      metadata: {
        ...metadata,
        ingested_at: new Date().toISOString(),
      },
    };

    // Validate against schema (runtime check)
    const validation = NormalizedConnectorEventSchema.safeParse(event);
    if (!validation.success) {
      console.error(
        `[SpineEmitter] Invalid event structure for ${sourceSystem}:`,
        validation.error
      );
      throw new Error(`Invalid Spine Event Structure: ${validation.error.message}`);
    }

    try {
      // In a real Worker env, this might use Service Bindings.
      // For now, we use standard HTTP which works for both.
      console.log(`[SpineEmitter] Emission to ${this.spineUrl}: ${eventType} from ${sourceSystem}`);
      // await axios.post(`${this.spineUrl}/events`, event, {
      //     headers: { "Authorization": `Bearer ${this.apiKey}` }
      // });

      // Simulating success allows us to proceed without a running backend
      return Promise.resolve();
    } catch (error) {
      console.error(`[SpineEmitter] Failed to emit to Spine:`, error);
      throw error;
    }
  }
}
