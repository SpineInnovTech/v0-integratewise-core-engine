/**
 * Guard concurrent Neon queries with queue + backpressure.
 * Prevents overwhelming serverless runtime and DB.
 * @integratewise/os - Resource Management
 */

import { resourceConfig } from "@/lib/resource-config"

class ConcurrencyGate {
  private running = 0
  private queue: Array<() => void> = []

  async acquire(): Promise<() => void> {
    if (this.running >= resourceConfig.db.maxConcurrent) {
      if (this.queue.length >= resourceConfig.db.queueLimit) {
        throw new Error("db_queue_overflow")
      }
      await new Promise<void>((resolve) => this.queue.push(resolve))
    }
    this.running++
    return () => {
      this.running--
      const next = this.queue.shift()
      if (next) next()
    }
  }

  stats() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: resourceConfig.db.maxConcurrent,
      queueLimit: resourceConfig.db.queueLimit,
    }
  }
}

export const dbGate = new ConcurrencyGate()
