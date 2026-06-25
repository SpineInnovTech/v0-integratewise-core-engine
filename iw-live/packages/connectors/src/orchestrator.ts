/**
 * @deprecated This class is superseded by the pipeline worker (v3.6 architecture).
 * Connector sync and accelerator triggering are now handled by the consolidated
 * pipeline worker via queue-based processing. Do not use this class in new code.
 * Scheduled for removal in the next major version.
 */
export class Orchestrator {
  async sync(_connectorId: string): Promise<void> {
    throw new Error(
      "NotImplementedError: Orchestrator.sync is deprecated. Use the pipeline worker queue instead."
    );
  }

  async runAccelerators(_connectorId: string): Promise<void> {
    throw new Error(
      "NotImplementedError: Orchestrator.runAccelerators is deprecated. Use the pipeline worker queue instead."
    );
  }
}
