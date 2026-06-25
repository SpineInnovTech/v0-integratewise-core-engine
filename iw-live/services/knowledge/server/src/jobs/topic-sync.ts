import { Firestore } from "@google-cloud/firestore";
import { config } from "./config";
import type { Topic } from "./types";
import * as firestoreService from "./services/firestore";
import * as search from "./services/search";

const firestore = new Firestore({
  projectId: config.gcp.projectId,
});

/**
 * Topic Sync Job
 * This job runs periodically to re-index topics based on their cadence
 *
 * Usage:
 * - Can be triggered via Cloud Scheduler
 * - Can be run as a standalone script: `npm run sync-topics`
 */

interface SyncStats {
  processed: number;
  skipped: number;
  errors: number;
}

/**
 * Check if topic needs sync based on cadence
 */
function needsSync(topic: Topic): boolean {
  if (!topic.last_synced_at) {
    return true; // Never synced
  }

  const lastSync = new Date(topic.last_synced_at);
  const now = new Date();
  const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

  switch (topic.cadence) {
    case "weekly":
      return hoursSinceSync >= 7 * 24; // 7 days
    case "biweekly":
      return hoursSinceSync >= 14 * 24; // 14 days
    default:
      return false;
  }
}

/**
 * Re-index sessions for a specific topic
 */
async function reindexTopic(tenantId: string, topic: Topic): Promise<number> {
  console.log(`  Reindexing topic: ${topic.name} (${topic.cadence})`);

  // Query Firestore for sessions with this topic
  const sessionsRef = firestore
    .collection(config.firestore.collectionPrefix)
    .doc(tenantId)
    .collection("sessions")
    .where("topics", "array-contains", topic.name);

  const snapshot = await sessionsRef.get();

  if (snapshot.empty) {
    console.log(`    No sessions found for topic: ${topic.name}`);
    return 0;
  }

  let reindexed = 0;

  for (const doc of snapshot.docs) {
    const session = doc.data();
    const title = session.summary_md?.split("\n")[0]?.substring(0, 120) || "Untitled";

    try {
      await search.upsertSearchDocument(
        tenantId,
        doc.id,
        title,
        session.summary_md || "",
        session.topics || [],
        session.created_at
      );
      reindexed++;
    } catch (error) {
      console.error(`    Error reindexing session ${doc.id}:`, error);
    }
  }

  // Update last_synced_at
  topic.last_synced_at = new Date().toISOString();
  await firestoreService.saveTopic(tenantId, topic);

  console.log(`    Reindexed ${reindexed} sessions`);
  return reindexed;
}

/**
 * Sync all topics for a tenant
 */
async function syncTopicsForTenant(tenantId: string): Promise<SyncStats> {
  const stats: SyncStats = {
    processed: 0,
    skipped: 0,
    errors: 0,
  };

  console.log(`\nSyncing topics for tenant: ${tenantId}`);

  try {
    const topics = await firestoreService.listTopics(tenantId);

    for (const topic of topics) {
      if (needsSync(topic)) {
        try {
          await reindexTopic(tenantId, topic);
          stats.processed++;
        } catch (error) {
          console.error(`  Error processing topic ${topic.name}:`, error);
          stats.errors++;
        }
      } else {
        console.log(`  Skipping topic: ${topic.name} (synced recently)`);
        stats.skipped++;
      }
    }
  } catch (error) {
    console.error(`Error syncing topics for tenant ${tenantId}:`, error);
    stats.errors++;
  }

  return stats;
}

/**
 * Main sync function - syncs all tenants
 */
async function syncAllTopics(): Promise<void> {
  console.log("=== Topic Sync Job Started ===");
  console.log(`Time: ${new Date().toISOString()}`);

  const totalStats: SyncStats = {
    processed: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Get all tenants
    const tenantsSnapshot = await firestore
      .collection(config.firestore.collectionPrefix)
      .listDocuments();

    for (const tenantDoc of tenantsSnapshot) {
      const tenantId = tenantDoc.id;
      const stats = await syncTopicsForTenant(tenantId);

      totalStats.processed += stats.processed;
      totalStats.skipped += stats.skipped;
      totalStats.errors += stats.errors;
    }
  } catch (error) {
    console.error("Error in topic sync job:", error);
  }

  console.log("\n=== Topic Sync Job Completed ===");
  console.log(`Total topics processed: ${totalStats.processed}`);
  console.log(`Total topics skipped: ${totalStats.skipped}`);
  console.log(`Total errors: ${totalStats.errors}`);
}

// Run if executed directly
if (require.main === module) {
  syncAllTopics()
    .then(() => {
      console.log("\nSync job finished successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nSync job failed:", error);
      process.exit(1);
    });
}

export { syncAllTopics, syncTopicsForTenant };
