import type { Session, Topic, Cadence, Provider, Attachment } from "../types";

// --- MOCK DATA ---
const now = new Date();
const mockSessions: Session[] = Array.from({ length: 25 }, (_, i) => {
  const sessionId = `session_${i + 1}`;
  const startDate = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
  const providers: Provider[] = ["gemini", "chatgpt", "claude", "grok", "other"];
  const topics = [
    ["react", "typescript"],
    ["gcp", "vertex-ai"],
    ["llms"],
    ["typescript", "cloudflare-workers"],
    [],
  ];
  const provider = providers[i % providers.length];
  const summaryTitle = `Session Summary for Project ${(i % 5) + 1}`;
  const summaryBody = `
This is a detailed summary of the session held on ${startDate.toLocaleDateString()}.

### Key Discussion Points
- **Topic A**: We discussed the implementation details of the new feature.
- **Topic B**: A review of the quarterly performance metrics was conducted.
- **Topic C**: Brainstorming for the next sprint's goals.

### Action Items
1.  User A to follow up on the API integration.
2.  User B to prepare the presentation for the stakeholders.

*Provider: ${provider}*
`;

  let attachments: Attachment[] | undefined = undefined;
  if (i % 3 === 0) {
    attachments = [
      {
        name: "architecture-diagram.png",
        gcs_path: `gs://integratewise-kb/demo-tenant/sessions/${sessionId}/attachments/architecture-diagram.png`,
      },
    ];
  }
  if (i % 5 === 0) {
    attachments = [
      ...(attachments || []),
      {
        name: "quarterly-results.xlsx",
        gcs_path: `gs://integratewise-kb/demo-tenant/sessions/${sessionId}/attachments/quarterly-results.xlsx`,
      },
    ];
  }

  return {
    id: sessionId,
    tenant_id: "demo-tenant",
    user_id: `user_${(i % 3) + 1}`,
    provider: provider,
    started_at: startDate.toISOString(),
    ended_at: endDate.toISOString(),
    summary_md: `${summaryTitle}\n${summaryBody}`,
    topics: topics[i % topics.length],
    attachments: attachments,
    project: `Project ${(i % 5) + 1}`,
  };
});

let mockTopics: Topic[] = [
  {
    id: "topic_1",
    name: "react",
    cadence: "weekly",
    last_synced_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "topic_2",
    name: "gcp",
    cadence: "biweekly",
    last_synced_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  { id: "topic_3", name: "vertex-ai", cadence: "weekly" },
  { id: "topic_4", name: "llms", cadence: "biweekly" },
  { id: "topic_5", name: "cloudflare-workers", cadence: "weekly" },
];

// --- MOCK API FUNCTIONS ---

const simulateNetworkDelay = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, 500);
  });
};

export const getSessions = async (): Promise<Session[]> => {
  return simulateNetworkDelay(mockSessions.slice(0, 20));
};

export const searchSessions = async (
  query: string,
  topics: string[],
  dateRange: { start?: string; end?: string }
): Promise<Session[]> => {
  let results = mockSessions;

  if (query) {
    results = results.filter((s) => s.summary_md.toLowerCase().includes(query.toLowerCase()));
  }

  if (topics.length > 0) {
    results = results.filter((s) => topics.every((t) => s.topics.includes(t)));
  }

  if (dateRange.start) {
    results = results.filter((s) => new Date(s.started_at) >= new Date(dateRange.start!));
  }
  if (dateRange.end) {
    results = results.filter((s) => new Date(s.started_at) <= new Date(dateRange.end!));
  }

  return simulateNetworkDelay(results);
};

export const getTopics = async (): Promise<Topic[]> => {
  return simulateNetworkDelay(mockTopics);
};

export const saveTopic = async (topic: Omit<Topic, "id"> & { id?: string }): Promise<Topic> => {
  if (topic.id) {
    // Update
    mockTopics = mockTopics.map((t) => (t.id === topic.id ? { ...t, ...topic } : t));
    return simulateNetworkDelay({ ...mockTopics.find((t) => t.id === topic.id)! });
  } else {
    // Create
    const newTopic: Topic = { ...topic, id: `topic_${Date.now()}` };
    mockTopics.push(newTopic);
    return simulateNetworkDelay(newTopic);
  }
};

export const deleteTopic = async (topicId: string): Promise<void> => {
  mockTopics = mockTopics.filter((t) => t.id !== topicId);
  return simulateNetworkDelay(undefined);
};
