import { Firestore } from "@google-cloud/firestore";
import { config } from "../config";
import type { SessionMetadata, Topic } from "../types";

const firestore = new Firestore({
  projectId: config.gcp.projectId,
});

// --- SESSION METHODS ---

/**
 * Save session metadata to Firestore
 * Path: tenants/{tenantId}/sessions/{sessionId}
 */
export async function saveSessionMetadata(
  tenantId: string,
  sessionId: string,
  metadata: SessionMetadata
): Promise<void> {
  const docRef = firestore
    .collection(config.firestore.collectionPrefix)
    .doc(tenantId)
    .collection("sessions")
    .doc(sessionId);

  await docRef.set(metadata);
}

/**
 * Get session metadata from Firestore
 */
export async function getSessionMetadata(
  tenantId: string,
  sessionId: string
): Promise<SessionMetadata | null> {
  const docRef = firestore
    .collection(config.firestore.collectionPrefix)
    .doc(tenantId)
    .collection("sessions")
    .doc(sessionId);

  const doc = await docRef.get();
  return doc.exists ? (doc.data() as SessionMetadata) : null;
}

/**
 * List recent sessions for a tenant (for inbox)
 */
export async function listRecentSessions(
  tenantId: string,
  limit: number = 20
): Promise<Array<SessionMetadata & { id: string }>> {
  const sessionsRef = firestore
    .collection(config.firestore.collectionPrefix)
    .doc(tenantId)
    .collection("sessions")
    .orderBy("created_at", "desc")
    .limit(limit);

  const snapshot = await sessionsRef.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<SessionMetadata & { id: string }>;
}

// --- TOPIC METHODS ---

/**
 * Get all topics for a tenant
 */
export async function listTopics(tenantId: string): Promise<Array<Topic>> {
  const topicsRef = firestore
    .collection(config.firestore.collectionPrefix)
    .doc(tenantId)
    .collection("topics");

  const snapshot = await topicsRef.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<Topic>;
}

/**
 * Create or update a topic
 */
export async function saveTopic(tenantId: string, topic: Topic): Promise<void> {
  const docRef = firestore
    .collection(config.firestore.collectionPrefix)
    .doc(tenantId)
    .collection("topics")
    .doc(topic.id);

  await docRef.set(topic);
}

/**
 * Delete a topic
 */
export async function deleteTopic(tenantId: string, topicId: string): Promise<void> {
  const docRef = firestore
    .collection(config.firestore.collectionPrefix)
    .doc(tenantId)
    .collection("topics")
    .doc(topicId);

  await docRef.delete();
}

/**
 * Get a single topic
 */
export async function getTopic(tenantId: string, topicId: string): Promise<Topic | null> {
  const docRef = firestore
    .collection(config.firestore.collectionPrefix)
    .doc(tenantId)
    .collection("topics")
    .doc(topicId);

  const doc = await docRef.get();
  return doc.exists ? ({ id: doc.id, ...doc.data() } as Topic) : null;
}
