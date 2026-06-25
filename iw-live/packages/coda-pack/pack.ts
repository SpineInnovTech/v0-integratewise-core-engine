import * as sdk from "@codahq/packs-sdk";

export const pack = sdk.newPack();

// ─── GATEWAY ENVIRONMENT & AUTH CONFIGURATION ────────────────────────────────
pack.addNetworkDomain("gateway.integratewise.ai");

pack.setUserAuthentication({
  type: sdk.AuthenticationType.HeaderBearerToken,
  instructionsUrl: "https://docs.integratewise.ai/sso/cloudflare-zero-trust",
});

// ─── SCHEMAS ─────────────────────────────────────────────────────────────────

const BookOfRecordsSchema = sdk.makeObjectSchema({
  properties: {
    id: { type: sdk.ValueType.String, required: true },
    tenantId: { type: sdk.ValueType.String, required: true },
    category: { type: sdk.ValueType.String, required: true },
    topic: { type: sdk.ValueType.String, required: true },
    content: { type: sdk.ValueType.String, required: true },
    version: { type: sdk.ValueType.String, required: true },
    governanceState: { type: sdk.ValueType.String, required: true },
    updatedAt: { type: sdk.ValueType.String, required: true },
  },
  displayProperty: "topic",
  idProperty: "id",
});

const PersonalMemorySchema = sdk.makeObjectSchema({
  properties: {
    id: { type: sdk.ValueType.String, required: true },
    tenantId: { type: sdk.ValueType.String, required: true },
    userId: { type: sdk.ValueType.String, required: true },
    memoryType: { type: sdk.ValueType.String, required: true },
    subject: { type: sdk.ValueType.String, required: true },
    content: { type: sdk.ValueType.String, required: true },
    confidenceScore: { type: sdk.ValueType.Number, required: true },
    source: { type: sdk.ValueType.String, required: true },
    isActive: { type: sdk.ValueType.Boolean, required: true },
    createdAt: { type: sdk.ValueType.String, required: true },
  },
  displayProperty: "subject",
  idProperty: "id",
});

const TriageQueueSchema = sdk.makeObjectSchema({
  properties: {
    id: { type: sdk.ValueType.String, required: true },
    tenantId: { type: sdk.ValueType.String, required: true },
    sessionId: { type: sdk.ValueType.String, required: true },
    userId: { type: sdk.ValueType.String, required: true },
    role: { type: sdk.ValueType.String, required: true },
    content: { type: sdk.ValueType.String, required: true },
    promotionState: { type: sdk.ValueType.String, required: true },
    createdAt: { type: sdk.ValueType.String, required: true },
  },
  displayProperty: "content",
  idProperty: "id",
});

const BookOfProjectsSchema = sdk.makeObjectSchema({
  properties: {
    id: { type: sdk.ValueType.String, required: true },
    tenantId: { type: sdk.ValueType.String, required: true },
    projectName: { type: sdk.ValueType.String, required: true },
    status: { type: sdk.ValueType.String, required: true },
    priority: { type: sdk.ValueType.String, required: true },
    owner: { type: sdk.ValueType.String, required: true },
    lastUpdated: { type: sdk.ValueType.String, required: true },
    summary: { type: sdk.ValueType.String, required: true },
  },
  displayProperty: "projectName",
  idProperty: "id",
});

// ─── SYNC TABLES ─────────────────────────────────────────────────────────────

// Sync Table 1: Book of Records (org_memory)
pack.addSyncTable({
  name: "BookOfRecords",
  description:
    "Canonical organizational memory — promoted, governed, and approved institutional knowledge.",
  identityName: "BookOfRecordsEntry",
  schema: BookOfRecordsSchema,
  formula: {
    name: "SyncBookOfRecords",
    description: "Fetches live org_memory items from the Spine.",
    parameters: [
      sdk.makeParameter({
        type: sdk.ParameterType.String,
        name: "category",
        description: "Filter by category (e.g., 'Engineering', 'Sales'). Leave empty for all.",
        optional: true,
      }),
      sdk.makeParameter({
        type: sdk.ParameterType.String,
        name: "governanceState",
        description:
          "Filter by governance state (staging, approved, published, archived). Leave empty for all.",
        optional: true,
      }),
    ],
    execute: async function ([category, governanceState], context) {
      let url = "https://gateway.integratewise.ai/api/v1/cognitive/memory/org";
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (governanceState) params.append("governance_state", governanceState);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await context.fetcher.fetch({ method: "GET", url });
      if (response.status !== 200) {
        throw new Error(`Failed to fetch Book of Records: ${response.statusText}`);
      }

      const items = (response.body as any).items || [];
      return {
        result: items.map((item: any) => ({
          id: item.id,
          tenantId: item.tenant_id,
          category: item.category,
          topic: item.topic,
          content: item.content,
          version: item.version || "1.0.0",
          governanceState: item.governance_state,
          updatedAt: item.updated_at,
        })),
      };
    },
  },
});

// Sync Table 2: Personal Memories (personal_memory)
pack.addSyncTable({
  name: "PersonalMemories",
  description: "Per-user behavioral patterns, preferences, and context — personal memory surface.",
  identityName: "PersonalMemoryEntry",
  schema: PersonalMemorySchema,
  formula: {
    name: "SyncPersonalMemories",
    description: "Fetches personal memory items for the authenticated user.",
    parameters: [
      sdk.makeParameter({
        type: sdk.ParameterType.String,
        name: "memoryType",
        description:
          "Filter by type (preference, behavioral_pattern, decision, skill_signal, communication_style, priority_pattern).",
        optional: true,
      }),
    ],
    execute: async function ([memoryType], context) {
      let url = "https://gateway.integratewise.ai/api/v1/cognitive/memory/personal";
      if (memoryType) url += `?memory_type=${memoryType}`;

      const response = await context.fetcher.fetch({ method: "GET", url });
      if (response.status !== 200) {
        throw new Error(`Failed to fetch Personal Memories: ${response.statusText}`);
      }

      const items = (response.body as any).items || [];
      return {
        result: items.map((item: any) => ({
          id: item.id,
          tenantId: item.tenant_id,
          userId: item.user_id,
          memoryType: item.memory_type,
          subject: item.subject,
          content: JSON.stringify(item.content),
          confidenceScore: item.confidence_score,
          source: item.source,
          isActive: item.is_active,
          createdAt: item.created_at,
        })),
      };
    },
  },
});

// Sync Table 3: Triage Queue (conversational_memory pending reviews)
pack.addSyncTable({
  name: "TriageQueue",
  description:
    "Pending reviews and promotion candidates — items awaiting Triage Bot and human approval.",
  identityName: "TriageQueueEntry",
  schema: TriageQueueSchema,
  formula: {
    name: "SyncTriageQueue",
    description: "Fetches items pending triage review from conversational_memory.",
    parameters: [
      sdk.makeParameter({
        type: sdk.ParameterType.String,
        name: "promotionState",
        description: "Filter by state (pending, flagged, promoted, rejected).",
        optional: true,
      }),
    ],
    execute: async function ([promotionState], context) {
      let url = "https://gateway.integratewise.ai/api/v1/cognitive/memory/triage";
      if (promotionState) url += `?promotion_state=${promotionState}`;

      const response = await context.fetcher.fetch({ method: "GET", url });
      if (response.status !== 200) {
        throw new Error(`Failed to fetch Triage Queue: ${response.statusText}`);
      }

      const items = (response.body as any).items || [];
      return {
        result: items.map((item: any) => ({
          id: item.id,
          tenantId: item.tenant_id,
          sessionId: item.session_id,
          userId: item.user_id,
          role: item.role,
          content: item.content,
          promotionState: item.promotion_state,
          createdAt: item.created_at,
        })),
      };
    },
  },
});

// Sync Table 4: Book of Projects (what the business knows about itself)
pack.addSyncTable({
  name: "BookOfProjects",
  description:
    "Project catalog — what the business knows about its own initiatives, status, and ownership.",
  identityName: "BookOfProjectsEntry",
  schema: BookOfProjectsSchema,
  formula: {
    name: "SyncBookOfProjects",
    description: "Fetches project entries from the Book of Projects.",
    parameters: [
      sdk.makeParameter({
        type: sdk.ParameterType.String,
        name: "status",
        description: "Filter by status (active, paused, completed, archived).",
        optional: true,
      }),
    ],
    execute: async function ([status], context) {
      let url = "https://gateway.integratewise.ai/api/v1/cognitive/projects";
      if (status) url += `?status=${status}`;

      const response = await context.fetcher.fetch({ method: "GET", url });
      if (response.status !== 200) {
        throw new Error(`Failed to fetch Book of Projects: ${response.statusText}`);
      }

      const items = (response.body as any).items || [];
      return {
        result: items.map((item: any) => ({
          id: item.id,
          tenantId: item.tenant_id,
          projectName: item.project_name,
          status: item.status,
          priority: item.priority,
          owner: item.owner,
          lastUpdated: item.last_updated,
          summary: item.summary,
        })),
      };
    },
  },
});

// ─── ACTION FORMULAS ─────────────────────────────────────────────────────────

// Action 1: Commit to Book of Records
pack.addFormula({
  name: "CommitToBookOfRecords",
  description:
    "Submit a new record to the Book of Records. Enters staging queue for Triage Bot and human approval.",
  parameters: [
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "category",
      description: "Memory category (e.g., 'Engineering', 'Sales', 'Marketing')",
    }),
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "topic",
      description: "The topic or file name of the document",
    }),
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "content",
      description: "Clean Markdown content of the document",
    }),
  ],
  resultType: sdk.ValueType.Object,
  schema: BookOfRecordsSchema,
  isAction: true,
  execute: async function ([category, topic, content], context) {
    const payload = {
      category,
      topic,
      content,
      metadata: {
        source: "coda-workbench",
        version: "2.1.0",
        governance_state: "staging",
      },
    };

    const response = await context.fetcher.fetch({
      method: "POST",
      url: "https://gateway.integratewise.ai/api/v1/cognitive/truth/commit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to commit: ${response.body?.error || response.statusText}`);
    }

    return response.body as any;
  },
});

// Action 2: Approve Record
pack.addFormula({
  name: "ApproveRecord",
  description: "Approve a staging record. Moves it from 'staging' to 'approved' state.",
  parameters: [
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "recordId",
      description: "The ID of the record to approve",
    }),
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "notes",
      description: "Optional approval notes",
      optional: true,
    }),
  ],
  resultType: sdk.ValueType.Object,
  schema: BookOfRecordsSchema,
  isAction: true,
  execute: async function ([recordId, notes], context) {
    const payload = { record_id: recordId, notes: notes || "" };

    const response = await context.fetcher.fetch({
      method: "POST",
      url: "https://gateway.integratewise.ai/api/v1/cognitive/memory/approve",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to approve: ${response.body?.error || response.statusText}`);
    }

    return response.body as any;
  },
});

// Action 3: Archive Record
pack.addFormula({
  name: "ArchiveRecord",
  description: "Archive an approved record. Moves it from 'approved' to 'archived' state.",
  parameters: [
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "recordId",
      description: "The ID of the record to archive",
    }),
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "reason",
      description: "Reason for archiving",
      optional: true,
    }),
  ],
  resultType: sdk.ValueType.Object,
  schema: BookOfRecordsSchema,
  isAction: true,
  execute: async function ([recordId, reason], context) {
    const payload = { record_id: recordId, reason: reason || "" };

    const response = await context.fetcher.fetch({
      method: "POST",
      url: "https://gateway.integratewise.ai/api/v1/cognitive/memory/archive",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to archive: ${response.body?.error || response.statusText}`);
    }

    return response.body as any;
  },
});

// Action 4: Submit Personal Memory
pack.addFormula({
  name: "SubmitPersonalMemory",
  description: "Submit a personal memory entry (behavioral pattern, preference, decision, etc.).",
  parameters: [
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "memoryType",
      description:
        "Type: preference, behavioral_pattern, decision, skill_signal, communication_style, priority_pattern",
    }),
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "subject",
      description: "What this memory is about",
    }),
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "content",
      description: "Memory content (JSON string or plain text)",
    }),
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "source",
      description: "Source: explicit, inferred, connector_derived, session_derived",
      optional: true,
    }),
  ],
  resultType: sdk.ValueType.Object,
  schema: PersonalMemorySchema,
  isAction: true,
  execute: async function ([memoryType, subject, content, source], context) {
    const payload = {
      memory_type: memoryType,
      subject,
      content: content.startsWith("{") ? JSON.parse(content) : { text: content },
      source: source || "explicit",
    };

    const response = await context.fetcher.fetch({
      method: "POST",
      url: "https://gateway.integratewise.ai/api/v1/cognitive/memory/personal",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      throw new Error(
        `Failed to submit personal memory: ${response.body?.error || response.statusText}`
      );
    }

    return response.body as any;
  },
});

// Action 5: Review Triage Item
pack.addFormula({
  name: "ReviewTriage",
  description: "Review a triage item — approve for promotion to org memory, or reject.",
  parameters: [
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "itemId",
      description: "The ID of the triage item to review",
    }),
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "action",
      description: "Action: approve or reject",
    }),
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "notes",
      description: "Optional review notes",
      optional: true,
    }),
  ],
  resultType: sdk.ValueType.Object,
  schema: TriageQueueSchema,
  isAction: true,
  execute: async function ([itemId, action, notes], context) {
    const payload = {
      item_id: itemId,
      action,
      notes: notes || "",
    };

    const response = await context.fetcher.fetch({
      method: "POST",
      url: "https://gateway.integratewise.ai/api/v1/cognitive/memory/triage/review",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      throw new Error(
        `Failed to review triage item: ${response.body?.error || response.statusText}`
      );
    }

    return response.body as any;
  },
});

// ─── READ FORMULAS ───────────────────────────────────────────────────────────

// Read Formula 1: Get Memory by Category
pack.addFormula({
  name: "GetMemoryByCategory",
  description: "Retrieve org memory entries filtered by category.",
  parameters: [
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "category",
      description: "Category to filter by (e.g., 'Engineering', 'Sales')",
    }),
  ],
  resultType: sdk.ValueType.Array,
  schema: BookOfRecordsSchema,
  execute: async function ([category], context) {
    const response = await context.fetcher.fetch({
      method: "GET",
      url: `https://gateway.integratewise.ai/api/v1/cognitive/memory/org?category=${encodeURIComponent(category)}`,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch memory: ${response.statusText}`);
    }

    const items = (response.body as any).items || [];
    return items.map((item: any) => ({
      id: item.id,
      tenantId: item.tenant_id,
      category: item.category,
      topic: item.topic,
      content: item.content,
      version: item.version || "1.0.0",
      governanceState: item.governance_state,
      updatedAt: item.updated_at,
    }));
  },
});

// Read Formula 2: Get Triage Queue
pack.addFormula({
  name: "GetTriageQueue",
  description: "Retrieve all items pending triage review.",
  parameters: [],
  resultType: sdk.ValueType.Array,
  schema: TriageQueueSchema,
  execute: async function ([], context) {
    const response = await context.fetcher.fetch({
      method: "GET",
      url: "https://gateway.integratewise.ai/api/v1/cognitive/memory/triage",
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch triage queue: ${response.statusText}`);
    }

    const items = (response.body as any).items || [];
    return items.map((item: any) => ({
      id: item.id,
      tenantId: item.tenant_id,
      sessionId: item.session_id,
      userId: item.user_id,
      role: item.role,
      content: item.content,
      promotionState: item.promotion_state,
      createdAt: item.created_at,
    }));
  },
});

// Read Formula 3: Get Personal Memories
pack.addFormula({
  name: "GetPersonalMemories",
  description: "Retrieve personal memory entries for the authenticated user.",
  parameters: [
    sdk.makeParameter({
      type: sdk.ParameterType.String,
      name: "memoryType",
      description: "Optional filter by memory type",
      optional: true,
    }),
  ],
  resultType: sdk.ValueType.Array,
  schema: PersonalMemorySchema,
  execute: async function ([memoryType], context) {
    let url = "https://gateway.integratewise.ai/api/v1/cognitive/memory/personal";
    if (memoryType) url += `?memory_type=${memoryType}`;

    const response = await context.fetcher.fetch({ method: "GET", url });
    if (response.status !== 200) {
      throw new Error(`Failed to fetch personal memories: ${response.statusText}`);
    }

    const items = (response.body as any).items || [];
    return items.map((item: any) => ({
      id: item.id,
      tenantId: item.tenant_id,
      userId: item.user_id,
      memoryType: item.memory_type,
      subject: item.subject,
      content: JSON.stringify(item.content),
      confidenceScore: item.confidence_score,
      source: item.source,
      isActive: item.is_active,
      createdAt: item.created_at,
    }));
  },
});

// Read Formula 4: Get System Status
pack.addFormula({
  name: "GetSystemStatus",
  description:
    "Retrieve IntegrateWise system status — connector health, pipeline status, agent status.",
  parameters: [],
  resultType: sdk.ValueType.String,
  execute: async function ([], context) {
    const response = await context.fetcher.fetch({
      method: "GET",
      url: "https://gateway.integratewise.ai/api/v1/cognitive/status",
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch system status: ${response.statusText}`);
    }

    const status = response.body as any;
    return JSON.stringify({
      connectors: status.connectors || "unknown",
      pipeline: status.pipeline || "unknown",
      agents: status.agents || "unknown",
      memory: status.memory || "unknown",
    });
  },
});
