/**
 * Tests for Memory Writeback with Retry & DLQ
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect, vi } from "vitest";
import { writeMemoryWithRetry, type MemoryWritebackParams, type MemoryWritebackEnv } from "./memory-writeback";

const baseParams: MemoryWritebackParams = {
  handoff_id: "hoff-001",
  memory_id: "mem-001",
  tenant_id: "tenant-test",
  content: "Test memory content",
  category: "execution_outcome",
};

function mockEnv(options: { failCount?: number; dlqAvailable?: boolean } = {}): MemoryWritebackEnv {
  let calls = 0;
  const failCount = options.failCount ?? 0;

  return {
    D1: {
      prepare: () => ({
        bind: () => ({
          run: async () => {
            calls++;
            if (calls <= failCount) {
              throw new Error(`Transient D1 error (attempt ${calls})`);
            }
            return { success: true };
          },
        }),
      }),
    } as unknown as D1Database,
    OPS_DLQ_QUEUE: options.dlqAvailable
      ? { send: vi.fn().mockResolvedValue(undefined) }
      : undefined,
  };
}

describe("writeMemoryWithRetry", () => {
  it("succeeds on first attempt", async () => {
    const env = mockEnv();
    const result = await writeMemoryWithRetry(baseParams, env, { maxRetries: 3, backoffBaseMs: 1 });
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(1);
  });

  it("retries on transient failure and succeeds", async () => {
    const env = mockEnv({ failCount: 2 });
    const result = await writeMemoryWithRetry(baseParams, env, { maxRetries: 3, backoffBaseMs: 1 });
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(3);
  });

  it("fails after max retries exhausted", async () => {
    const env = mockEnv({ failCount: 5 });
    const result = await writeMemoryWithRetry(baseParams, env, { maxRetries: 3, backoffBaseMs: 1 });
    expect(result.success).toBe(false);
    expect(result.attempts).toBe(3);
    expect(result.dlq).toBe(true);
    expect(result.error).toContain("Transient D1 error");
  });

  it("sends to DLQ on persistent failure when queue available", async () => {
    const env = mockEnv({ failCount: 5, dlqAvailable: true });
    const result = await writeMemoryWithRetry(baseParams, env, { maxRetries: 2, backoffBaseMs: 1 });
    expect(result.success).toBe(false);
    expect(result.dlq).toBe(true);
    expect(env.OPS_DLQ_QUEUE!.send).toHaveBeenCalledTimes(1);
    expect(env.OPS_DLQ_QUEUE!.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "memory_writeback_failure",
        handoff_id: "hoff-001",
        memory_id: "mem-001",
      })
    );
  });

  it("handles missing DLQ gracefully", async () => {
    const env = mockEnv({ failCount: 5, dlqAvailable: false });
    const result = await writeMemoryWithRetry(baseParams, env, { maxRetries: 2, backoffBaseMs: 1 });
    expect(result.success).toBe(false);
    expect(result.dlq).toBe(true);
    // No throw — graceful degradation
  });
});
