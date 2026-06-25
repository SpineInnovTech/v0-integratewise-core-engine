import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { BulkLoadTask, BulkLoadResult, IntelligenceEnv } from "./types";
import { getAgentFactory } from "./factory";

export class BulkCleanupSwarmWorkflow extends WorkflowEntrypoint<IntelligenceEnv, BulkLoadTask> {
  async run(event: WorkflowEvent<BulkLoadTask>, step: WorkflowStep): Promise<BulkLoadResult> {
    const task = event.payload;

    const cleanerFactory = getAgentFactory("data_cleaner");
    const resolverFactory = getAgentFactory("entity_resolver");

    if (!cleanerFactory || !resolverFactory) {
      throw new Error("Missing bulk data agents");
    }

    const cleaner = cleanerFactory(this.env);
    const resolver = resolverFactory(this.env);

    const CHUNK_SIZE = 5;
    let processedCount = 0;
    let entitiesExtracted = 0;
    const errors: string[] = [];

    // Fan-out processing
    for (let i = 0; i < task.records.length; i += CHUNK_SIZE) {
      const chunk = task.records.slice(i, i + CHUNK_SIZE);

      const chunkResult = await step.do(`clean-chunk-${i}`, async (): Promise<any> => {
        try {
          const cleanRes = await cleaner.execute(
            {
              taskId: `${task.taskId}-chunk-${i}`,
              tenantId: task.tenantId,
              userId: task.userId,
              objective: "clean",
              context: { records: chunk, sourceType: task.sourceType },
              priority: "medium",
            },
            step
          );

          const resolveRes = await resolver.execute(
            {
              taskId: `${task.taskId}-resolve-${i}`,
              tenantId: task.tenantId,
              userId: task.userId,
              objective: "resolve",
              context: { cleanedData: cleanRes.output },
              priority: "medium",
            },
            step
          );

          return {
            success: true,
            count: chunk.length,
            entities: (resolveRes.output as any).resolvedEntities?.length || 0,
          };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      });

      if (chunkResult.success) {
        processedCount += chunkResult.count;
        entitiesExtracted += chunkResult.entities;
      } else {
        errors.push(`Chunk ${i} failed: ${chunkResult.error}`);
      }
    }

    return {
      taskId: task.taskId,
      lineageId: task.lineageId,
      processedCount,
      entitiesExtracted,
      errors,
      status: errors.length === 0 ? "completed" : processedCount > 0 ? "partial" : "failed",
    };
  }
}
