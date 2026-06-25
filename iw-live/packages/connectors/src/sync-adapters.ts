/**
 * Sync Adapters — Wraps each real-API connector's existing methods into a unified sync() interface.
 * Pattern: call connector's existing API methods -> map to normalized { entity_type, name, source, source_id, data }.
 * Supports: phase: 'creamy' (top N), phase: 'needed' (cursor-based), since (delta).
 *
 * Spine principle: sync() produces entities shaped for the Spine pipeline.
 */

import { mapGitHubBatch } from "./project-management/github-spine-mapping";
import { createGitHubConnector } from "./project-management/github";

export interface SyncOptions {
  phase?: "creamy" | "needed" | "delta";
  since?: string;
  cursor?: string;
  limit?: number;
  entityType?: string;
}

export interface NormalizedEntity {
  entity_type: string;
  name: string;
  source: string;
  source_id: string;
  data: Record<string, any>;
}

export interface SyncResult {
  entities: NormalizedEntity[];
  next_cursor?: string;
}

// ── HubSpot ──────────────────────────────────────────────────────────────────

function mapHubSpotContact(r: any): NormalizedEntity {
  const p = r.properties || r;
  return {
    entity_type: "contact",
    name: [p.firstname, p.lastname].filter(Boolean).join(" ") || p.email || "Unknown",
    source: "hubspot",
    source_id: String(r.id || p.hs_object_id || ""),
    data: {
      email: p.email,
      phone: p.phone,
      company: p.company,
      lifecycle_stage: p.lifecyclestage,
      ...p,
    },
  };
}

function mapHubSpotCompany(r: any): NormalizedEntity {
  const p = r.properties || r;
  return {
    entity_type: "account",
    name: p.name || p.domain || "Unknown",
    source: "hubspot",
    source_id: String(r.id || p.hs_object_id || ""),
    data: {
      domain: p.domain,
      industry: p.industry,
      city: p.city,
      country: p.country,
      num_employees: p.numberofemployees,
      ...p,
    },
  };
}

function mapHubSpotDeal(r: any): NormalizedEntity {
  const p = r.properties || r;
  return {
    entity_type: "deal",
    name: p.dealname || "Untitled Deal",
    source: "hubspot",
    source_id: String(r.id || p.hs_object_id || ""),
    data: {
      amount_usd: Number(p.amount) || 0,
      stage: p.dealstage,
      close_date: p.closedate,
      pipeline: p.pipeline,
      ...p,
    },
  };
}

export async function syncHubSpot(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "contact") {
    const res = await connector.getContacts(limit, opts.cursor, opts.since);
    entities.push(...(res.results || []).map(mapHubSpotContact));
    if (res.paging?.next?.after) nextCursor = res.paging.next.after;
  }
  if (!opts.entityType || opts.entityType === "account") {
    const res = await connector.getCompanies(limit, opts.cursor, opts.since);
    entities.push(...(res.results || []).map(mapHubSpotCompany));
    if (res.paging?.next?.after && !nextCursor) nextCursor = res.paging.next.after;
  }
  if (!opts.entityType || opts.entityType === "deal") {
    const res = await connector.getDeals(limit, opts.cursor, opts.since);
    entities.push(...(res.results || []).map(mapHubSpotDeal));
    if (res.paging?.next?.after && !nextCursor) nextCursor = res.paging.next.after;
  }

  return { entities, next_cursor: nextCursor };
}

// ── Salesforce ────────────────────────────────────────────────────────────────

export async function syncSalesforce(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const entities: NormalizedEntity[] = [];
  const salesforceOrgId =
    connector?.organizationId ||
    connector?.orgId ||
    connector?.config?.organizationId ||
    connector?.config?.orgId ||
    connector?.config?.provider_workspace_id ||
    null;
  const sinceClause = opts.since ? ` WHERE LastModifiedDate > ${opts.since}` : "";

  if (!opts.entityType || opts.entityType === "account") {
    const res = await connector.query(
      `SELECT Id, Name, Industry, BillingCountry, NumberOfEmployees, Website FROM Account${sinceClause} LIMIT ${limit}`
    );
    entities.push(
      ...(res.records || []).map((r: any) => ({
        entity_type: "account",
        name: r.Name || "Unknown",
        source: "salesforce",
        source_id: r.Id,
        data: {
          industry_vertical: r.Industry,
          country: r.BillingCountry,
          num_employees: r.NumberOfEmployees,
          website: r.Website,
          source_org_id: salesforceOrgId,
        },
      }))
    );
  }
  if (!opts.entityType || opts.entityType === "contact") {
    const res = await connector.query(
      `SELECT Id, FirstName, LastName, Email, Phone, Department FROM Contact${sinceClause} LIMIT ${limit}`
    );
    entities.push(
      ...(res.records || []).map((r: any) => ({
        entity_type: "contact",
        name: [r.FirstName, r.LastName].filter(Boolean).join(" ") || r.Email || "Unknown",
        source: "salesforce",
        source_id: r.Id,
        data: {
          email: r.Email,
          phone: r.Phone,
          department: r.Department,
          source_org_id: salesforceOrgId,
        },
      }))
    );
  }
  if (!opts.entityType || opts.entityType === "opportunity" || opts.entityType === "renewal") {
    const res = await connector.query(
      `SELECT Id, Name, Amount, StageName, CloseDate FROM Opportunity${sinceClause} LIMIT ${limit}`
    );
    for (const r of res.records || []) {
      if (!opts.entityType || opts.entityType === "opportunity") {
        entities.push({
          entity_type: "opportunity",
          name: r.Name || "Untitled",
          source: "salesforce",
          source_id: r.Id,
          data: {
            estimated_value_usd: r.Amount,
            pipeline_stage: r.StageName,
            expected_close_date: r.CloseDate,
            source_org_id: salesforceOrgId,
          },
        });
      }
      if (!opts.entityType || opts.entityType === "renewal") {
        entities.push({
          entity_type: "renewal",
          name: r.Name || "Renewal Opportunity",
          source: "salesforce",
          source_id: `${r.Id}:renewal`,
          data: {
            contract_value: r.Amount,
            status: r.StageName,
            renewal_date: r.CloseDate,
            source_org_id: salesforceOrgId,
          },
        });
      }
    }
  }

  return { entities };
}

// ── Stripe ────────────────────────────────────────────────────────────────────

export async function syncStripe(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "account") {
    const res = (await connector.getCustomers?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((c: any) => ({
        entity_type: "account",
        name: c.name || c.email || "Unknown",
        source: "stripe",
        source_id: c.id,
        data: { email: c.email, currency: c.currency, created: c.created, balance: c.balance },
      }))
    );
    if (res.next_cursor) nextCursor = res.next_cursor;
  }
  if (!opts.entityType || opts.entityType === "invoice") {
    const res = (await connector.getInvoices?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((i: any) => ({
        entity_type: "invoice",
        name: `Invoice ${i.number || i.id}`,
        source: "stripe",
        source_id: i.id,
        data: {
          amount_cents: i.amount_due,
          currency: i.currency,
          status: i.status,
          due_date: i.due_date,
        },
      }))
    );
    if (res.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }
  if (!opts.entityType || opts.entityType === "subscription") {
    const res = (await connector.getSubscriptions?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((s: any) => ({
        entity_type: "subscription",
        name: `Sub ${s.id}`,
        source: "stripe",
        source_id: s.id,
        data: {
          status: s.status,
          plan_id: s.plan?.id,
          current_period_start: s.current_period_start,
          current_period_end: s.current_period_end,
        },
      }))
    );
    if (res.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  return { entities, next_cursor: nextCursor };
}

// ── GitHub ────────────────────────────────────────────────────────────────────

export async function syncGitHub(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const slice = <T>(v: any): T[] => (Array.isArray(v) ? v : v?.data || []).slice(0, limit);

  // Pull whatever the connector exposes; map ALL of it to canonical Spine entities
  // via the pure mapper (proven in github-spine-mapping.test.ts). No raw records leak.
  const want = (t: string) => !opts.entityType || opts.entityType === t;

  // Support bare {accessToken} from loader buildConnectorInstance (Nango path) or full GitHubConnector instance.
  const token = connector?.accessToken || connector?.config?.accessToken || connector?.token;
  let gh: any = null;
  if (token && typeof token === "string") {
    try {
      gh = createGitHubConnector({ token });
    } catch {
      /* fall through to provided methods */
    }
  }
  const getReposFn =
    connector?.getRepos?.bind(connector) ||
    connector?.listRepos?.bind(connector) ||
    (gh ? () => gh.listRepos({ per_page: limit }) : null);
  const getIssuesFn =
    connector?.getIssues?.bind(connector) || connector?.listIssues?.bind(connector) || null;
  const getPRsFn =
    connector?.getPullRequests?.bind(connector) ||
    connector?.listPullRequests?.bind(connector) ||
    null;
  const getCommitsFn = connector?.getCommits?.bind(connector) || null;

  let repos: any[] = [];
  if (want("repository") && getReposFn) {
    try {
      repos = slice(await getReposFn());
    } catch (e) {
      /* ignore per-repo errors in creamy */
    }
  } else if (gh && want("repository")) {
    try {
      repos = slice(await gh.listRepos({ per_page: limit }));
    } catch {
      /* ignore */
    }
  }

  let issues: any[] = [];
  if (want("task")) {
    if (getIssuesFn) {
      try {
        issues = slice(await getIssuesFn());
      } catch {
        /* ignore */
      }
    }
    if (issues.length === 0 && gh) {
      // Nango/loader path: discover from top repos (creamy is intentionally small)
      const top = repos.slice(0, 3);
      for (const r of top) {
        const full =
          r.full_name || (r.owner?.login ? `${r.owner.login}/${r.name || r.repo}` : null);
        if (!full) continue;
        const [owner, repoName] = full.split("/");
        if (!owner || !repoName) continue;
        try {
          const iss = await gh.listIssues(owner, repoName, { per_page: 5, state: "all" });
          issues.push(...(Array.isArray(iss) ? iss : []));
        } catch {
          /* ignore */
        }
      }
    }
  }

  let pullRequests: any[] = [];
  if (want("pull_request")) {
    if (getPRsFn) {
      try {
        pullRequests = slice(await getPRsFn());
      } catch {
        /* ignore */
      }
    }
    if (pullRequests.length === 0 && gh) {
      const top = repos.slice(0, 3);
      for (const r of top) {
        const full =
          r.full_name || (r.owner?.login ? `${r.owner.login}/${r.name || r.repo}` : null);
        if (!full) continue;
        const [owner, repoName] = full.split("/");
        if (!owner || !repoName) continue;
        try {
          const prs = await gh.listPullRequests(owner, repoName, { per_page: 5, state: "all" });
          pullRequests.push(...(Array.isArray(prs) ? prs : []));
        } catch {
          /* ignore */
        }
      }
    }
  }

  let commits: any[] = [];
  if (want("activity")) {
    if (getCommitsFn) {
      try {
        commits = slice(await getCommitsFn());
      } catch {
        /* ignore */
      }
    }
    if (commits.length === 0 && gh) {
      const top = repos.slice(0, 2);
      for (const r of top) {
        const full =
          r.full_name || (r.owner?.login ? `${r.owner.login}/${r.name || r.repo}` : null);
        if (!full) continue;
        const [owner, repoName] = full.split("/");
        if (!owner || !repoName) continue;
        try {
          const cm = await gh.listCommits(owner, repoName, { per_page: 5 });
          commits.push(...(Array.isArray(cm) ? cm : []));
        } catch {
          /* ignore */
        }
      }
    }
  }

  const contributors: any[] = []; // contributors optional for creamy; map will tolerate

  const entities = mapGitHubBatch({ repos, issues, pullRequests, commits, contributors });
  return { entities };
}

// ── Jira ──────────────────────────────────────────────────────────────────────

export async function syncJira(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;
  const entities: NormalizedEntity[] = [];

  const issues = (await connector.getIssues?.({ maxResults: limit })) || { issues: [] };
  entities.push(
    ...(issues.issues || []).map((i: any) => ({
      entity_type: "ticket",
      name: `${i.key}: ${i.fields?.summary || "Untitled"}`,
      source: "jira",
      source_id: i.id || i.key,
      data: {
        key: i.key,
        status: i.fields?.status?.name,
        priority: i.fields?.priority?.name,
        assignee: i.fields?.assignee?.displayName,
        project: i.fields?.project?.name,
      },
    }))
  );

  return { entities };
}

// ── Notion ────────────────────────────────────────────────────────────────────

export async function syncNotion(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const entities: NormalizedEntity[] = [];

  const pages = (await connector.getPages?.({ page_size: limit })) || { results: [] };
  entities.push(
    ...(pages.results || []).map((p: any) => ({
      entity_type: "file",
      name:
        p.properties?.title?.title?.[0]?.text?.content ||
        p.properties?.Name?.title?.[0]?.text?.content ||
        "Untitled",
      source: "notion",
      source_id: p.id,
      data: {
        url: p.url,
        created_time: p.created_time,
        last_edited_time: p.last_edited_time,
        object: p.object,
      },
    }))
  );

  return { entities };
}

// ── Slack ─────────────────────────────────────────────────────────────────────

export async function syncSlack(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const channels = (await connector.getChannels?.()) || { channels: [] };
  const list = channels.channels || channels || [];
  return {
    entities: (Array.isArray(list) ? list.slice(0, limit) : []).map((c: any) => ({
      entity_type: "audience",
      name: c.name || c.id,
      source: "slack",
      source_id: c.id,
      data: {
        is_private: c.is_private,
        num_members: c.num_members,
        topic: c.topic?.value,
        purpose: c.purpose?.value,
      },
    })),
  };
}

// ── Gmail ─────────────────────────────────────────────────────────────────────

export async function syncGmail(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;
  const syncResult =
    (await connector.getMessagesForSync?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    })) || {};

  const hydratedMessages =
    syncResult.messages ||
    (
      await connector.listMessages?.({
        maxResults: limit,
        pageToken: opts.cursor,
        since: opts.since,
      })
    )?.messages ||
    [];

  return {
    entities: hydratedMessages.map((m: any) => ({
      entity_type: "interaction_event",
      name: m.snippet || m.subject || `Message ${m.id}`,
      source: "gmail",
      source_id: m.id,
      data: {
        thread_id: m.threadId,
        snippet: m.snippet,
        label_ids: m.labelIds,
        history_id: m.historyId,
      },
    })),
    next_cursor: syncResult.next_cursor,
  };
}

// ── Tableau ───────────────────────────────────────────────────────────────────

export async function syncTableau(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;
  const entities: NormalizedEntity[] = [];

  const views = (await connector.getViews?.({ pageSize: limit })) || { views: [] };
  entities.push(
    ...(views.views || []).map((v: any, idx: number) => ({
      entity_type: "platform_health_metric",
      name: v.name || v.id || "Tableau View",
      source: "tableau",
      source_id: String(v.id || v.luid || v.name || `tableau-view-${Date.now()}-${idx}`),
      data: {
        workbook_name: v.workbook?.name,
        owner: v.owner?.name,
        content_url: v.contentUrl,
        sheet_type: v.sheetType,
        source_system: "tableau",
      },
    }))
  );

  const workbooks = (await connector.getWorkbooks?.({ pageSize: limit })) || { workbooks: [] };
  entities.push(
    ...(workbooks.workbooks || []).map((w: any, idx: number) => ({
      entity_type: "value_stream",
      name: w.name || w.id || "Tableau Workbook",
      source: "tableau",
      source_id: String(w.id || w.luid || w.name || `tableau-workbook-${Date.now()}-${idx}`),
      data: {
        project_name: w.projectName || w.project?.name,
        owner: w.owner?.name,
        size: w.size,
        source_system: "tableau",
      },
    }))
  );

  return { entities };
}

// ── Outlook ───────────────────────────────────────────────────────────────────

export async function syncOutlook(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;
  const messages = (await connector.getMessages?.({ top: limit })) || { value: [] };
  return {
    entities: (messages.value || []).map((m: any) => ({
      entity_type: "interaction_event",
      name: m.subject || `Message ${m.id}`,
      source: "outlook",
      source_id: m.id,
      data: {
        from: m.from?.emailAddress?.address,
        received: m.receivedDateTime,
        is_read: m.isRead,
      },
    })),
  };
}

// ── Linear ────────────────────────────────────────────────────────────────────

export async function syncLinear(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;
  const issues = (await connector.getIssues?.({ first: limit })) || { nodes: [] };
  return {
    entities: (issues.nodes || issues.issues || []).map((i: any) => ({
      entity_type: "ticket",
      name: `${i.identifier || ""}: ${i.title}`.trim(),
      source: "linear",
      source_id: i.id,
      data: {
        state: i.state?.name,
        priority: i.priority,
        assignee: i.assignee?.name,
        team: i.team?.name,
      },
    })),
  };
}

// ── Zendesk ───────────────────────────────────────────────────────────────────

export async function syncZendesk(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "ticket") {
    const res = await connector.getTickets?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    });
    const tickets = res?.data || [];
    entities.push(
      ...tickets.map((t: any) => ({
        entity_type: "ticket",
        name: t.subject || `Ticket #${t.id}`,
        source: "zendesk",
        source_id: String(t.id),
        data: {
          status: t.status,
          priority: t.priority,
          requester_id: t.requester_id,
          assignee_id: t.assignee_id,
          organization_id: t.organization_id,
          created_at: t.created_at,
          updated_at: t.updated_at,
          due_at: t.due_at,
        },
      }))
    );
    if (res?.next_cursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "contact") {
    const res = await connector.getUsers?.({ limit, cursor: opts.cursor });
    const users = res?.data || [];
    entities.push(
      ...users.map((u: any) => ({
        entity_type: "contact",
        name: u.name || u.email || "Unknown",
        source: "zendesk",
        source_id: String(u.id),
        data: {
          email: u.email,
          phone: u.phone,
          role: u.role,
          created_at: u.created_at,
          updated_at: u.updated_at,
        },
      }))
    );
    if (res?.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "account") {
    const res = await connector.getOrganizations?.({ limit, cursor: opts.cursor });
    const orgs = res?.data || [];
    entities.push(
      ...orgs.map((o: any) => ({
        entity_type: "account",
        name: o.name || "Unknown",
        source: "zendesk",
        source_id: String(o.id),
        data: {
          domain_names: o.domain_names,
          tags: o.tags,
          created_at: o.created_at,
          updated_at: o.updated_at,
        },
      }))
    );
    if (res?.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  return { entities, next_cursor: nextCursor };
}

// ── Intercom ──────────────────────────────────────────────────────────────────

export async function syncIntercom(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "contact") {
    const res = await connector.getContacts?.({ limit, cursor: opts.cursor });
    const contacts = res?.data || [];
    entities.push(
      ...contacts.map((c: any) => ({
        entity_type: "contact",
        name: c.name || c.email || "Unknown",
        source: "intercom",
        source_id: c.id,
        data: {
          email: c.email,
          phone: c.phone,
          role: c.role,
          created_at: c.created_at,
          updated_at: c.updated_at,
          last_seen_at: c.last_seen_at,
          company_ids: c.companies?.data?.map((comp: any) => comp.id),
        },
      }))
    );
    if (res?.next_cursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "account") {
    const res = await connector.getCompanies?.({ limit, cursor: opts.cursor });
    const companies = res?.data || [];
    entities.push(
      ...companies.map((c: any) => ({
        entity_type: "account",
        name: c.name || "Unknown",
        source: "intercom",
        source_id: c.id,
        data: {
          company_id: c.company_id,
          plan: c.plan,
          monthly_spend: c.monthly_spend,
          session_count: c.session_count,
          user_count: c.user_count,
          created_at: c.created_at,
          updated_at: c.updated_at,
        },
      }))
    );
    if (res?.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "ticket") {
    const res = await connector.getConversations?.({ limit, cursor: opts.cursor });
    const conversations = res?.data || [];
    entities.push(
      ...conversations.map((c: any) => ({
        entity_type: "ticket",
        name: c.source?.subject || `Conversation ${c.id}`,
        source: "intercom",
        source_id: c.id,
        data: {
          state: c.state,
          priority: c.priority,
          created_at: c.created_at,
          updated_at: c.updated_at,
          user_id: c.user?.id,
          assignee_id: c.assignee?.id,
        },
      }))
    );
    if (res?.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  return { entities, next_cursor: nextCursor };
}

// ── Google Drive ──────────────────────────────────────────────────────────────

export async function syncGoogleDrive(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const files = (await connector.getFiles?.({ pageSize: limit })) || { files: [] };
  return {
    entities: (files.files || []).map((f: any) => ({
      entity_type: "file",
      name: f.name,
      source: "google-drive",
      source_id: f.id,
      data: {
        mime_type: f.mimeType,
        modified_time: f.modifiedTime,
        size: f.size,
        web_link: f.webViewLink,
      },
    })),
  };
}

// ── Google Sheets ─────────────────────────────────────────────────────────────

export async function syncGoogleSheets(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;
  let nextCursor: string | undefined;

  // 1. List spreadsheets (via Drive API filtered by mime type)
  if (!opts.entityType || opts.entityType === "spreadsheet") {
    const result = (await connector.listSpreadsheets?.({
      pageSize: limit,
      pageToken: opts.cursor,
    })) || { files: [], nextPageToken: undefined };

    entities.push(
      ...((result.files || []) as any[]).map((f: any) => ({
        entity_type: "spreadsheet",
        name: f.name || "Untitled Spreadsheet",
        source: "google-sheets",
        source_id: f.id,
        data: {
          created_time: f.createdTime,
          modified_time: f.modifiedTime,
          web_link: f.webViewLink,
          shared: f.shared,
          owner: f.owners?.[0]?.emailAddress,
          owner_name: f.owners?.[0]?.displayName,
        },
      }))
    );

    if (result.nextPageToken) {
      nextCursor = result.nextPageToken;
    }
  }

  // 2. For "sheet" entity type, fetch sheet metadata within each spreadsheet
  if (opts.entityType === "sheet") {
    const spreadsheets = (await connector.listSpreadsheets?.({
      pageSize: Math.min(limit, 10),
      pageToken: opts.cursor,
    })) || { files: [] };

    for (const file of (spreadsheets.files || []) as any[]) {
      try {
        const spreadsheet = await connector.getSpreadsheet?.(file.id, false);
        if (spreadsheet?.sheets) {
          entities.push(
            ...spreadsheet.sheets.map((s: any) => ({
              entity_type: "sheet",
              name: `${file.name} / ${s.properties?.title || "Sheet"}`,
              source: "google-sheets",
              source_id: `${file.id}::${s.properties?.sheetId}`,
              data: {
                spreadsheet_id: file.id,
                spreadsheet_name: file.name,
                sheet_id: s.properties?.sheetId,
                title: s.properties?.title,
                index: s.properties?.index,
                sheet_type: s.properties?.sheetType,
                row_count: s.properties?.gridProperties?.rowCount,
                column_count: s.properties?.gridProperties?.columnCount,
                hidden: s.properties?.hidden,
              },
            }))
          );
        }
      } catch {
        // Skip spreadsheets we can't access
      }
    }

    if (spreadsheets.nextPageToken) {
      nextCursor = spreadsheets.nextPageToken;
    }
  }

  return { entities, next_cursor: nextCursor };
}

// ── Tally ERP / Tally Prime ───────────────────────────────────────────────────

export async function syncTally(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;

  // Ledgers (Sundry Debtors = customers, Sundry Creditors = vendors)
  if (!opts.entityType || opts.entityType === "account" || opts.entityType === "ledger") {
    const debtors = (await connector.getSundryDebtors?.(limit)) || [];
    entities.push(
      ...debtors.map((l: any) => ({
        entity_type: "account",
        name: l.name || "Unknown Ledger",
        source: "tally",
        source_id: `ledger-${l.name}`,
        data: {
          parent: l.parent,
          opening_balance: l.openingBalance,
          closing_balance: l.closingBalance,
          gstin: l.gstin,
          gst_registration_type: l.gstRegistrationType,
          address: l.address,
          state: l.state,
          pincode: l.pincode,
          email: l.email,
          phone: l.phone,
          ledger_type: "sundry_debtor",
        },
      }))
    );

    const creditors = (await connector.getSundryCreditors?.(limit)) || [];
    entities.push(
      ...creditors.map((l: any) => ({
        entity_type: "account",
        name: l.name || "Unknown Ledger",
        source: "tally",
        source_id: `ledger-${l.name}`,
        data: {
          parent: l.parent,
          opening_balance: l.openingBalance,
          closing_balance: l.closingBalance,
          gstin: l.gstin,
          gst_registration_type: l.gstRegistrationType,
          address: l.address,
          state: l.state,
          pincode: l.pincode,
          email: l.email,
          phone: l.phone,
          ledger_type: "sundry_creditor",
        },
      }))
    );
  }

  // Vouchers (Sales = invoices, Purchase = bills)
  if (!opts.entityType || opts.entityType === "invoice" || opts.entityType === "voucher") {
    const salesVouchers = (await connector.getSalesVouchers?.(limit)) || [];
    entities.push(
      ...salesVouchers.map((v: any) => ({
        entity_type: "invoice",
        name: `Invoice ${v.voucherNumber || "N/A"}`,
        source: "tally",
        source_id: `voucher-${v.voucherNumber}-${v.date}`,
        data: {
          voucher_number: v.voucherNumber,
          date: v.date,
          voucher_type: v.voucherType,
          party: v.partyLedgerName,
          amount: v.amount,
          narration: v.narration,
          is_invoice: v.isInvoice,
        },
      }))
    );
  }

  // Stock Items (Inventory)
  if (!opts.entityType || opts.entityType === "product" || opts.entityType === "stock_item") {
    const items = (await connector.getStockItems?.({ limit })) || [];
    entities.push(
      ...items.map((s: any) => ({
        entity_type: "product",
        name: s.name || "Unknown Item",
        source: "tally",
        source_id: `stock-${s.name}`,
        data: {
          parent: s.parent,
          opening_balance: s.openingBalance,
          closing_balance: s.closingBalance,
          closing_value: s.closingValue,
          base_units: s.baseUnits,
          hsn_code: s.hsnCode,
          gst_applicable: s.gstApplicable,
        },
      }))
    );
  }

  return { entities };
}

// ── QuickBooks ─────────────────────────────────────────────────────────────────

export async function syncQuickBooks(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "invoice") {
    const invoicesResult =
      (await connector.getInvoices?.({ limit, cursor: opts.cursor, since: opts.since })) || [];
    const invoices = Array.isArray(invoicesResult) ? invoicesResult : invoicesResult.data || [];
    entities.push(
      ...invoices.map((i: any) => ({
        entity_type: "invoice",
        name: `Invoice ${i.DocNumber || i.Id}`,
        source: "quickbooks",
        source_id: String(i.Id),
        data: {
          total: i.TotalAmt,
          balance: i.Balance,
          due_date: i.DueDate,
          status: i.Balance > 0 ? "OPEN" : "CLOSED",
        },
      }))
    );
    if (!Array.isArray(invoicesResult) && invoicesResult.next_cursor) {
      nextCursor = invoicesResult.next_cursor;
    }
  }
  if (!opts.entityType || opts.entityType === "account") {
    const customersResult =
      (await connector.getCustomers?.({ limit, cursor: opts.cursor, since: opts.since })) || [];
    const customers = Array.isArray(customersResult) ? customersResult : customersResult.data || [];
    entities.push(
      ...customers.map((c: any) => ({
        entity_type: "account",
        name: c.DisplayName || c.CompanyName || "Unknown",
        source: "quickbooks",
        source_id: String(c.Id),
        data: {
          email: c.PrimaryEmailAddr?.Address,
          phone: c.PrimaryPhone?.FreeFormNumber,
          balance: c.Balance,
        },
      }))
    );
    if (!Array.isArray(customersResult) && customersResult.next_cursor && !nextCursor) {
      nextCursor = customersResult.next_cursor;
    }
  }

  return { entities, next_cursor: nextCursor };
}

// ── Razorpay ─────────────────────────────────────────────────────────────────

export async function syncRazorpay(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;

  // Payments
  if (!opts.entityType || opts.entityType === "payment") {
    const result = (await connector.getPayments?.({
      count: limit,
      skip: opts.cursor ? parseInt(opts.cursor) : 0,
    })) || { items: [] };
    entities.push(
      ...(result.items || []).map((p: any) => ({
        entity_type: "payment",
        name: `Payment ${p.id}`,
        source: "razorpay",
        source_id: p.id,
        data: {
          amount: p.amount / 100,
          currency: p.currency,
          status: p.status,
          method: p.method,
          order_id: p.order_id,
          email: p.email,
          contact: p.contact,
          description: p.description,
          fee: p.fee ? p.fee / 100 : undefined,
          tax: p.tax ? p.tax / 100 : undefined,
          bank: p.bank,
          wallet: p.wallet,
          vpa: p.vpa,
          international: p.international,
          created_at: p.created_at ? new Date(p.created_at * 1000).toISOString() : undefined,
        },
      }))
    );
  }

  // Orders
  if (!opts.entityType || opts.entityType === "order") {
    const result = (await connector.getOrders?.({
      count: limit,
      skip: opts.cursor ? parseInt(opts.cursor) : 0,
    })) || { items: [] };
    entities.push(
      ...(result.items || []).map((o: any) => ({
        entity_type: "order",
        name: `Order ${o.id}`,
        source: "razorpay",
        source_id: o.id,
        data: {
          amount: o.amount / 100,
          amount_paid: o.amount_paid / 100,
          amount_due: o.amount_due / 100,
          currency: o.currency,
          receipt: o.receipt,
          status: o.status,
          created_at: o.created_at ? new Date(o.created_at * 1000).toISOString() : undefined,
        },
      }))
    );
  }

  // Settlements
  if (opts.entityType === "settlement") {
    const result = (await connector.getSettlements?.({ count: limit })) || { items: [] };
    entities.push(
      ...(result.items || []).map((s: any) => ({
        entity_type: "settlement",
        name: `Settlement ${s.id}`,
        source: "razorpay",
        source_id: s.id,
        data: {
          amount: s.amount / 100,
          status: s.status,
          fees: s.fees / 100,
          tax: s.tax / 100,
          utr: s.utr,
          created_at: s.created_at ? new Date(s.created_at * 1000).toISOString() : undefined,
        },
      }))
    );
  }

  // Disputes
  if (opts.entityType === "dispute") {
    const result = (await connector.getDisputes?.({ count: limit })) || { items: [] };
    entities.push(
      ...(result.items || []).map((d: any) => ({
        entity_type: "dispute",
        name: `Dispute ${d.id}`,
        source: "razorpay",
        source_id: d.id,
        data: {
          payment_id: d.payment_id,
          amount: d.amount / 100,
          currency: d.currency,
          status: d.status,
          reason_code: d.reason_code,
          reason_description: d.reason_description,
          phase: d.phase,
          respond_by: d.respond_by ? new Date(d.respond_by * 1000).toISOString() : undefined,
          created_at: d.created_at ? new Date(d.created_at * 1000).toISOString() : undefined,
        },
      }))
    );
  }

  // Customers
  if (!opts.entityType || opts.entityType === "contact" || opts.entityType === "customer") {
    const result = (await connector.getCustomers?.({ count: limit })) || { items: [] };
    entities.push(
      ...(result.items || []).map((c: any) => ({
        entity_type: "contact",
        name: c.name || c.email || "Unknown Customer",
        source: "razorpay",
        source_id: c.id,
        data: {
          email: c.email,
          phone: c.contact,
          gstin: c.gstin,
          created_at: c.created_at ? new Date(c.created_at * 1000).toISOString() : undefined,
        },
      }))
    );
  }

  return { entities };
}

// ── Shopify ───────────────────────────────────────────────────────────────────

export async function syncShopify(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;
  const orders = (await connector.getOrders?.({ limit })) || { orders: [] };
  return {
    entities: (orders.orders || orders || []).map((o: any) => ({
      entity_type: "order",
      name: `Order ${o.name || o.order_number}`,
      source: "shopify",
      source_id: String(o.id),
      data: {
        total_price: o.total_price,
        currency: o.currency,
        financial_status: o.financial_status,
        fulfillment_status: o.fulfillment_status,
        customer_email: o.email,
      },
    })),
  };
}

// ── Mailchimp ─────────────────────────────────────────────────────────────────

export async function syncMailchimp(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const listsRes = (await connector.getLists?.({
    count: limit,
    offset: opts.cursor ? parseInt(opts.cursor, 10) : 0,
  })) || { lists: [] };
  const lists = listsRes.lists || listsRes || [];
  const campaignRes = (await connector.getCampaigns?.({
    count: opts.phase === "creamy" ? 5 : limit,
    since_send_time: opts.since,
  })) || { campaigns: [] };
  const campaigns = campaignRes.campaigns || campaignRes || [];
  const entities: NormalizedEntity[] = [];
  entities.push(
    ...(Array.isArray(lists) ? lists.slice(0, limit) : []).map((l: any) => ({
      entity_type: "audience",
      name: l.name,
      source: "mailchimp",
      source_id: l.id,
      data: {
        member_count: l.stats?.member_count,
        open_rate: l.stats?.open_rate,
        click_rate: l.stats?.click_rate,
        date_created: l.date_created,
      },
    }))
  );
  entities.push(
    ...(Array.isArray(campaigns)
      ? campaigns.slice(0, opts.phase === "creamy" ? 5 : limit)
      : []
    ).map((c: any) => ({
      entity_type: "campaign",
      name: c.settings?.subject_line || c.subject_line || `Campaign ${c.id}`,
      source: "mailchimp",
      source_id: c.id,
      data: {
        status: c.status,
        send_time: c.send_time,
        create_time: c.create_time,
      },
    }))
  );
  return { entities };
}

// ── HubSpot Marketing ────────────────────────────────────────────────────────

export async function syncHubSpotMarketing(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const res = (await connector.getCampaigns?.(limit, opts.cursor)) || { results: [] };
  const campaigns = res.results || res || [];
  return {
    entities: (Array.isArray(campaigns) ? campaigns.slice(0, limit) : []).map((c: any) => ({
      entity_type: "campaign",
      name: c.name || c.hs_name || c.campaignGuid || "Untitled",
      source: "hubspot-marketing",
      source_id: c.campaignGuid || c.id || String(c.id),
      data: {
        hs_start_date: c.hs_start_date,
        hs_end_date: c.hs_end_date,
        hs_notes: c.hs_notes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      },
    })),
    next_cursor: res.paging?.next?.after,
  };
}

// ── SendGrid ─────────────────────────────────────────────────────────────────

export async function syncSendGrid(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const res = (await connector.getCampaigns?.({ limit })) || { result: [] };
  const campaigns = res.result || res || [];
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  const stats =
    (await connector.getStats?.(
      start.toISOString().slice(0, 10),
      end.toISOString().slice(0, 10)
    )) || [];
  const entities: NormalizedEntity[] = [];
  entities.push(
    ...(Array.isArray(campaigns) ? campaigns.slice(0, limit) : []).map((c: any) => ({
      entity_type: "campaign",
      name: c.title || c.subject || `Campaign ${c.id}`,
      source: "sendgrid",
      source_id: String(c.id),
      data: {
        status: c.status,
        created_at: c.created_at,
        updated_at: c.updated_at,
      },
    }))
  );
  if (entities.length === 0 && Array.isArray(stats) && stats.length > 0) {
    const s = stats[0];
    entities.push({
      entity_type: "platform_health_metric",
      name: "SendGrid Email Stats",
      source: "sendgrid",
      source_id: `stats-${s.date || "unknown"}`,
      data: {
        requests: s.requests,
        delivered: s.delivered,
        opens: s.opens,
        clicks: s.clicks,
        date: s.date,
      },
    });
  }
  return { entities };
}

// ── Braze ────────────────────────────────────────────────────────────────────

export async function syncBraze(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const page = opts.cursor ? parseInt(opts.cursor, 10) : 0;
  const res = (await connector.getCampaigns?.(page, limit)) || { campaigns: [] };
  const campaigns = res.campaigns || res || [];
  return {
    entities: (Array.isArray(campaigns) ? campaigns.slice(0, limit) : []).map((c: any) => ({
      entity_type: "campaign",
      name: c.name || c.id || "Untitled",
      source: "braze",
      source_id: String(c.id),
      data: {
        created_at: c.created_at,
        updated_at: c.updated_at,
      },
    })),
    next_cursor: campaigns.length >= limit ? String(page + 1) : undefined,
  };
}

// ── Marketo ───────────────────────────────────────────────────────────────────

export async function syncMarketo(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 200;
  const res = (await connector.getCampaigns?.({ maxReturn: limit, offset: opts.cursor })) || {
    result: [],
  };
  const campaigns = res.result || res || [];
  return {
    entities: (Array.isArray(campaigns) ? campaigns.slice(0, limit) : []).map((c: any) => ({
      entity_type: "campaign",
      name: c.name || `Campaign ${c.id}`,
      source: "marketo",
      source_id: String(c.id),
      data: {
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      },
    })),
    next_cursor: res.nextPageToken,
  };
}

// ── Customer.io ───────────────────────────────────────────────────────────────

export async function syncCustomerIO(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const res = (await connector.getCampaigns?.({
    limit,
    offset: opts.cursor ? parseInt(opts.cursor, 10) : 0,
  })) || { campaigns: [] };
  const campaigns = res.campaigns || res || [];
  return {
    entities: (Array.isArray(campaigns) ? campaigns.slice(0, limit) : []).map((c: any) => ({
      entity_type: "campaign",
      name: c.name || `Campaign ${c.id}`,
      source: "customer-io",
      source_id: String(c.id),
      data: {
        created_at: c.created_at,
        updated_at: c.updated_at,
      },
    })),
  };
}

// ── Heap ─────────────────────────────────────────────────────────────────────

export async function syncHeap(connector: any, _opts: SyncOptions): Promise<SyncResult> {
  const info = await connector.getProjectInfo?.();
  if (!info?.app_id) return { entities: [] };
  return {
    entities: [
      {
        entity_type: "platform_health_metric",
        name: info.name || `Heap (${info.app_id})`,
        source: "heap",
        source_id: info.app_id,
        data: { app_id: info.app_id },
      },
    ],
  };
}

// ── Amplitude ────────────────────────────────────────────────────────────────

export async function syncAmplitude(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const end = opts.since ? new Date(opts.since) : new Date();
  const start = new Date(end);
  start.setHours(start.getHours() - (opts.phase === "creamy" ? 24 : 168));
  const startStr = start.toISOString().slice(0, 13).replace(/[-:]/g, "").replace("T", "T");
  const endStr = end.toISOString().slice(0, 13).replace(/[-:]/g, "").replace("T", "T");
  const events = (await connector.getEventExport?.(startStr, endStr)) || [];
  return {
    entities: (Array.isArray(events) ? events.slice(0, limit) : []).map((e: any, i: number) => ({
      entity_type: "interaction_event",
      name: e.event_type || `Event ${i}`,
      source: "amplitude",
      source_id: e.$insert_id || e.uuid || `amp-${Date.now()}-${i}`,
      data: {
        event_type: e.event_type,
        user_id: e.user_id,
        device_id: e.device_id,
        time: e.time,
        event_properties: e.event_properties,
      },
    })),
  };
}

// ── Airtable ─────────────────────────────────────────────────────────────────

export async function syncAirtable(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const res = (await connector.getBases?.()) || { bases: [] };
  const bases = res.bases || res || [];
  return {
    entities: (Array.isArray(bases) ? bases.slice(0, limit) : []).map((b: any) => ({
      entity_type: "file",
      name: b.name || b.id || "Untitled Base",
      source: "airtable",
      source_id: b.id,
      data: {
        permissionLevel: b.permissionLevel,
      },
    })),
  };
}

// ── Mixpanel ──────────────────────────────────────────────────────────────────

export async function syncMixpanel(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 20 : opts.limit || 500;
  const result =
    (await connector.getEventsForSync?.({
      since: opts.since,
      cursor: opts.cursor,
      limit,
    })) || {};
  const events = result.events || [];

  return {
    entities: events.map((event: any, index: number) => ({
      entity_type: "interaction_event",
      name: event.event || `Mixpanel Event ${index + 1}`,
      source: "mixpanel",
      source_id:
        event?.properties?.$insert_id ||
        `${event?.event || "event"}:${event?.properties?.distinct_id || "unknown"}:${event?.properties?.time || index}`,
      data: {
        event: event.event,
        distinct_id: event?.properties?.distinct_id,
        event_time: event?.properties?.time,
        properties: event?.properties || {},
      },
    })),
    next_cursor: result.next_cursor,
  };
}

// ── Google Analytics ──────────────────────────────────────────────────────────

export async function syncGoogleAnalytics(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 20 : opts.limit || 500;
  const offset = opts.cursor ? parseInt(opts.cursor, 10) || 0 : 0;
  const result =
    (await connector.getEventsForSync?.({
      since: opts.since,
      limit,
      offset,
    })) || {};
  const rows = result.rows || [];

  return {
    entities: rows.map((row: any, index: number) => {
      const eventName = row?.dimensionValues?.[0]?.value || "unknown_event";
      const eventTime = row?.dimensionValues?.[1]?.value;
      const eventCount = row?.metricValues?.[0]?.value;
      const activeUsers = row?.metricValues?.[1]?.value;
      return {
        entity_type: "interaction_event",
        name: eventName,
        source: "google-analytics",
        source_id: `${eventName}:${eventTime || index}`,
        data: {
          event_name: eventName,
          event_time: eventTime,
          event_count: eventCount ? Number(eventCount) : undefined,
          active_users: activeUsers ? Number(activeUsers) : undefined,
          raw: row,
        },
      };
    }),
    next_cursor: result.next_cursor,
  };
}

// ── Pipedrive ─────────────────────────────────────────────────────────────────

export async function syncPipedrive(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "contact") {
    const res = (await connector.getContacts?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((person: any) => ({
        entity_type: "contact",
        name: person.name || person.email?.[0]?.value || "Unknown",
        source: "pipedrive",
        source_id: String(person.id),
        data: {
          email: person.email?.[0]?.value,
          phone: person.phone?.[0]?.value,
          owner_id: person.owner_id?.id || person.owner_id,
          org_id: person.org_id?.value || person.org_id,
          update_time: person.update_time,
          source_system: "pipedrive",
        },
      }))
    );
    if (res.next_cursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "account") {
    const res = (await connector.getAccounts?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((org: any) => ({
        entity_type: "account",
        name: org.name || "Unknown",
        source: "pipedrive",
        source_id: String(org.id),
        data: {
          owner_id: org.owner_id?.id || org.owner_id,
          address: org.address,
          people_count: org.people_count,
          open_deals_count: org.open_deals_count,
          update_time: org.update_time,
          source_system: "pipedrive",
        },
      }))
    );
    if (res.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "deal") {
    const res = (await connector.getDeals?.({ limit, cursor: opts.cursor, since: opts.since })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((deal: any) => ({
        entity_type: "deal",
        name: deal.title || "Untitled Deal",
        source: "pipedrive",
        source_id: String(deal.id),
        data: {
          value: deal.value,
          currency: deal.currency,
          stage_id: deal.stage_id,
          status: deal.status,
          close_date: deal.close_date,
          org_id: deal.org_id?.value || deal.org_id,
          person_id: deal.person_id?.value || deal.person_id,
          update_time: deal.update_time,
          source_system: "pipedrive",
        },
      }))
    );
    if (res.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  return { entities, next_cursor: nextCursor };
}

// ── Freshsales ────────────────────────────────────────────────────────────────

export async function syncFreshsales(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "contact") {
    const res = (await connector.getContacts?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((contact: any) => ({
        entity_type: "contact",
        name:
          `${contact.first_name || contact.firstName || ""} ${contact.last_name || contact.lastName || ""}`.trim() ||
          contact.email ||
          "Unknown",
        source: "freshsales",
        source_id: String(contact.id),
        data: {
          email: contact.email,
          phone: contact.phone_number || contact.mobile_number,
          lifecycle_stage: contact.lifecycle_stage,
          updated_at: contact.updated_at,
          source_system: "freshsales",
        },
      }))
    );
    if (res.next_cursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "account") {
    const res = (await connector.getAccounts?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((account: any) => ({
        entity_type: "account",
        name: account.name || account.account_name || "Unknown",
        source: "freshsales",
        source_id: String(account.id),
        data: {
          website: account.website,
          industry: account.industry,
          address: account.address,
          updated_at: account.updated_at,
          source_system: "freshsales",
        },
      }))
    );
    if (res.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "deal") {
    const res = (await connector.getDeals?.({ limit, cursor: opts.cursor, since: opts.since })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((deal: any) => ({
        entity_type: "deal",
        name: deal.name || deal.title || "Untitled Deal",
        source: "freshsales",
        source_id: String(deal.id),
        data: {
          amount: deal.amount,
          expected_close_date: deal.expected_close_date,
          stage: deal.stage || deal.sales_stage,
          probability: deal.probability,
          updated_at: deal.updated_at,
          source_system: "freshsales",
        },
      }))
    );
    if (res.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  return { entities, next_cursor: nextCursor };
}

// ── Close ─────────────────────────────────────────────────────────────────────

export async function syncClose(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "contact") {
    const res = (await connector.getContacts?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((contact: any) => ({
        entity_type: "contact",
        name: contact.name || contact.email || "Unknown",
        source: "close",
        source_id: String(contact.id),
        data: {
          emails: contact.emails,
          phones: contact.phones,
          lead_id: contact.lead_id,
          date_updated: contact.date_updated,
          source_system: "close",
        },
      }))
    );
    if (res.next_cursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "account") {
    const res = (await connector.getAccounts?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((lead: any) => ({
        entity_type: "account",
        name: lead.name || "Unknown",
        source: "close",
        source_id: String(lead.id),
        data: {
          status_id: lead.status_id,
          display_name: lead.display_name,
          addresses: lead.addresses,
          date_updated: lead.date_updated,
          source_system: "close",
        },
      }))
    );
    if (res.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "deal") {
    const res = (await connector.getDeals?.({ limit, cursor: opts.cursor, since: opts.since })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((opportunity: any) => ({
        entity_type: "deal",
        name: opportunity.note || `Opportunity ${opportunity.id}`,
        source: "close",
        source_id: String(opportunity.id),
        data: {
          value: opportunity.value,
          value_currency: opportunity.value_currency,
          status: opportunity.status,
          confidence: opportunity.confidence,
          lead_id: opportunity.lead_id,
          expected_date: opportunity.expected_date,
          date_updated: opportunity.date_updated,
          source_system: "close",
        },
      }))
    );
    if (res.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  return { entities, next_cursor: nextCursor };
}

// ── Chargebee ────────────────────────────────────────────────────────────────

export async function syncChargebee(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "account") {
    const res = (await connector.getCustomers?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((customer: any) => ({
        entity_type: "account",
        name: customer.company || customer.first_name || customer.email || "Unknown",
        source: "chargebee",
        source_id: String(customer.id),
        data: {
          email: customer.email,
          currency_code: customer.currency_code,
          billing_address: customer.billing_address,
          created_at: customer.created_at,
          updated_at: customer.updated_at,
          source_system: "chargebee",
        },
      }))
    );
    if (res.next_cursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "subscription") {
    const res = (await connector.getSubscriptions?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((subscription: any) => ({
        entity_type: "subscription",
        name: subscription.id || "Unknown Subscription",
        source: "chargebee",
        source_id: String(subscription.id),
        data: {
          customer_id: subscription.customer_id,
          status: subscription.status,
          mrr: subscription.mrr,
          currency_code: subscription.currency_code,
          current_term_start: subscription.current_term_start,
          current_term_end: subscription.current_term_end,
          updated_at: subscription.updated_at,
          source_system: "chargebee",
        },
      }))
    );
    if (res.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "invoice") {
    const res = (await connector.getInvoices?.({
      limit,
      cursor: opts.cursor,
      since: opts.since,
    })) || {
      data: [],
    };
    entities.push(
      ...(res.data || []).map((invoice: any) => ({
        entity_type: "invoice",
        name: invoice.id || "Unknown Invoice",
        source: "chargebee",
        source_id: String(invoice.id),
        data: {
          customer_id: invoice.customer_id,
          amount_due: invoice.amount_due,
          amount_paid: invoice.amount_paid,
          status: invoice.status,
          date: invoice.date,
          paid_at: invoice.paid_at,
          updated_at: invoice.updated_at,
          source_system: "chargebee",
        },
      }))
    );
    if (res.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  return { entities, next_cursor: nextCursor };
}

// ── Registry: provider name → sync function ──────────────────────────────────

// ── Metabase ─────────────────────────────────────────────────────────────────

export async function syncMetabase(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];

  if (!opts.entityType || opts.entityType === "dashboard") {
    const dashboards = await connector.getDashboards?.();
    entities.push(
      ...(opts.phase === "creamy" ? dashboards.slice(0, 10) : dashboards).map((d: any) => ({
        entity_type: "dashboard",
        name: d.name || "Untitled Dashboard",
        source: "metabase",
        source_id: String(d.id),
        data: {
          description: d.description,
          collection_id: d.collection_id,
          creator_id: d.creator_id,
          created_at: d.created_at,
          updated_at: d.updated_at,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "report") {
    const cards = await connector.getCards?.();
    entities.push(
      ...(opts.phase === "creamy" ? cards.slice(0, 10) : cards).map((c: any) => ({
        entity_type: "report",
        name: c.name || "Untitled Card",
        source: "metabase",
        source_id: String(c.id),
        data: {
          description: c.description,
          display: c.display,
          collection_id: c.collection_id,
          creator_id: c.creator_id,
          created_at: c.created_at,
          updated_at: c.updated_at,
        },
      }))
    );
  }

  return { entities };
}

// ── Vyapar ───────────────────────────────────────────────────────────────────

export async function syncVyapar(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;

  if (!opts.entityType || opts.entityType === "invoice") {
    const result = (await connector.getInvoices?.({
      limit,
      offset: opts.cursor ? parseInt(opts.cursor) : 0,
    })) || { data: [] };
    entities.push(
      ...(result.data || []).map((inv: any) => ({
        entity_type: "invoice",
        name: `Invoice ${inv.invoiceNumber || inv.id}`,
        source: "vyapar",
        source_id: String(inv.id),
        data: {
          invoice_number: inv.invoiceNumber,
          customer_name: inv.customerName,
          date: inv.date,
          due_date: inv.dueDate,
          total_amount: inv.totalAmount,
          paid_amount: inv.paidAmount,
          balance_due: inv.balanceDue,
          status: inv.status,
          gstin: inv.gstin,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "contact" || opts.entityType === "customer") {
    const result = (await connector.getCustomers?.({
      limit,
      offset: opts.cursor ? parseInt(opts.cursor) : 0,
    })) || { data: [] };
    entities.push(
      ...(result.data || []).map((c: any) => ({
        entity_type: "contact",
        name: c.name || "Unknown Customer",
        source: "vyapar",
        source_id: String(c.id),
        data: {
          phone: c.phone,
          email: c.email,
          gstin: c.gstin,
          address: c.address,
          city: c.city,
          state: c.state,
          pincode: c.pincode,
          balance: c.balance,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "product") {
    const result = (await connector.getProducts?.({ limit })) || { data: [] };
    entities.push(
      ...(result.data || []).map((p: any) => ({
        entity_type: "product",
        name: p.name || "Unknown Product",
        source: "vyapar",
        source_id: String(p.id),
        data: {
          sale_price: p.salePrice,
          purchase_price: p.purchasePrice,
          stock: p.stock,
          unit: p.unit,
          hsn_code: p.hsnCode,
          gst_rate: p.gstRate,
          category: p.category,
        },
      }))
    );
  }

  return { entities };
}

// ── Khatabook ────────────────────────────────────────────────────────────────

export async function syncKhatabook(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;

  if (!opts.entityType || opts.entityType === "transaction" || opts.entityType === "ledger_entry") {
    const result = (await connector.getLedgerEntries?.({ limit })) || { data: [] };
    entities.push(
      ...(result.data || []).map((entry: any) => ({
        entity_type: "transaction",
        name: `Entry ${entry.id || "N/A"}`,
        source: "khatabook",
        source_id: String(entry.id),
        data: entry,
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "contact" || opts.entityType === "customer") {
    const result = (await connector.getCustomers?.({ limit })) || { data: [] };
    entities.push(
      ...(result.data || []).map((c: any) => ({
        entity_type: "contact",
        name: c.name || "Unknown",
        source: "khatabook",
        source_id: String(c.id),
        data: c,
      }))
    );
  }

  return { entities };
}

// ── Shiprocket ───────────────────────────────────────────────────────────────

export async function syncShiprocket(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;

  if (!opts.entityType || opts.entityType === "order") {
    const result = (await connector.getOrders?.({
      per_page: limit,
      page: opts.cursor ? parseInt(opts.cursor) : 1,
    })) || { data: [] };
    entities.push(
      ...(result.data || []).map((o: any) => ({
        entity_type: "order",
        name: `Order ${o.channel_order_id || o.id}`,
        source: "shiprocket",
        source_id: String(o.id),
        data: {
          channel_order_id: o.channel_order_id,
          customer_name: o.customer_name,
          customer_email: o.customer_email,
          customer_phone: o.customer_phone,
          status: o.status,
          payment_method: o.payment_method,
          total: o.total,
          sub_total: o.sub_total,
          shipping_charges: o.shipping_charges,
          created_at: o.created_at,
          pickup_location: o.pickup_location,
          items: o.items,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "shipment") {
    const result = (await connector.getShipments?.({ per_page: limit })) || { data: [] };
    entities.push(
      ...(result.data || []).map((s: any) => ({
        entity_type: "shipment",
        name: `Shipment ${s.awb_code || s.id}`,
        source: "shiprocket",
        source_id: String(s.id),
        data: {
          order_id: s.order_id,
          awb_code: s.awb_code,
          courier_name: s.courier_name,
          status: s.status,
          delivered_date: s.delivered_date,
          etd: s.etd,
          weight: s.weight,
        },
      }))
    );
  }

  return { entities };
}

// ── Paddle ───────────────────────────────────────────────────────────────────

export async function syncPaddle(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const page = opts.cursor ? parseInt(opts.cursor, 10) : 1;

  if (!opts.entityType || opts.entityType === "subscription") {
    const subs = await connector.getSubscriptions?.({ page });
    entities.push(
      ...(opts.phase === "creamy" ? subs.slice(0, 10) : subs).map((s: any) => ({
        entity_type: "subscription",
        name: `Subscription ${s.subscription_id}`,
        source: "paddle",
        source_id: String(s.subscription_id),
        data: {
          plan_id: s.plan_id,
          user_email: s.user_email,
          state: s.state,
          signup_date: s.signup_date,
          next_payment_amount: s.next_payment?.amount,
          next_payment_date: s.next_payment?.date,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "transaction") {
    const txns = await connector.getTransactions?.({ page });
    entities.push(
      ...(opts.phase === "creamy" ? txns.slice(0, 10) : txns).map((t: any) => ({
        entity_type: "transaction",
        name: `Order ${t.order_id}`,
        source: "paddle",
        source_id: t.order_id,
        data: {
          amount: t.amount,
          currency: t.currency,
          status: t.status,
          product_id: t.product_id,
          user_email: t.user?.email,
          created_at: t.created_at,
        },
      }))
    );
  }

  return { entities };
}

// ── WooCommerce ──────────────────────────────────────────────────────────────

export async function syncWooCommerce(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const page = opts.cursor ? parseInt(opts.cursor, 10) : 1;
  const per_page = opts.phase === "creamy" ? 10 : opts.limit || 100;

  if (!opts.entityType || opts.entityType === "product") {
    const products = await connector.getProducts?.({ page, per_page, modified_after: opts.since });
    entities.push(
      ...products.map((p: any) => ({
        entity_type: "product",
        name: p.name,
        source: "woocommerce",
        source_id: String(p.id),
        data: {
          sku: p.slug,
          price: p.price,
          stock_status: p.stock_status,
          stock_quantity: p.stock_quantity,
          categories: p.categories?.map((c: any) => c.name),
          date_created: p.date_created,
          date_modified: p.date_modified,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "order") {
    const orders = await connector.getOrders?.({ page, per_page, modified_after: opts.since });
    entities.push(
      ...orders.map((o: any) => ({
        entity_type: "order",
        name: `Order ${o.id}`,
        source: "woocommerce",
        source_id: String(o.id),
        data: {
          status: o.status,
          total: o.total,
          currency: o.currency,
          customer_email: o.billing?.email,
          date_created: o.date_created,
          date_modified: o.date_modified,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "contact") {
    const customers = await connector.getCustomers?.({
      page,
      per_page,
      modified_after: opts.since,
    });
    entities.push(
      ...customers.map((c: any) => ({
        entity_type: "contact",
        name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email,
        source: "woocommerce",
        source_id: String(c.id),
        data: {
          email: c.email,
          first_name: c.first_name,
          last_name: c.last_name,
          company: c.billing?.company,
          date_created: c.date_created,
          date_modified: c.date_modified,
        },
      }))
    );
  }

  return { entities };
}

// ── BigCommerce ──────────────────────────────────────────────────────────────

export async function syncBigCommerce(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const page = opts.cursor ? parseInt(opts.cursor, 10) : 1;
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;

  if (!opts.entityType || opts.entityType === "product") {
    const res = await connector.getProducts?.({ page, limit, date_modified: opts.since });
    const products = res?.data || [];
    entities.push(
      ...products.map((p: any) => ({
        entity_type: "product",
        name: p.name,
        source: "bigcommerce",
        source_id: String(p.id),
        data: {
          sku: p.sku,
          price: p.price,
          inventory_level: p.inventory_level,
          categories: p.categories,
          date_created: p.date_created,
          date_modified: p.date_modified,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "order") {
    const orders = await connector.getOrders?.({ page, limit, min_date_modified: opts.since });
    entities.push(
      ...orders.map((o: any) => ({
        entity_type: "order",
        name: `Order ${o.id}`,
        source: "bigcommerce",
        source_id: String(o.id),
        data: {
          status: o.status,
          total: o.total_inc_tax,
          currency: o.currency_code,
          customer_email: o.billing_address?.email,
          date_created: o.date_created,
          date_modified: o.date_modified,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "contact") {
    const res = await connector.getCustomers?.({ page, limit, date_modified: opts.since });
    const customers = res?.data || [];
    entities.push(
      ...customers.map((c: any) => ({
        entity_type: "contact",
        name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email,
        source: "bigcommerce",
        source_id: String(c.id),
        data: {
          email: c.email,
          first_name: c.first_name,
          last_name: c.last_name,
          company: c.company,
          date_created: c.date_created,
          date_modified: c.date_modified,
        },
      }))
    );
  }

  return { entities };
}

// ── OneDrive ─────────────────────────────────────────────────────────────────

export async function syncOneDrive(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];

  if (opts.since || opts.cursor) {
    const delta = await connector.getDelta?.(opts.cursor);
    entities.push(
      ...(opts.phase === "creamy" ? delta.value.slice(0, 10) : delta.value).map((item: any) => ({
        entity_type: "file",
        name: item.name,
        source: "onedrive",
        source_id: item.id,
        data: {
          size: item.size,
          web_url: item.webUrl,
          is_folder: !!item.folder,
          created_at: item.createdDateTime,
          modified_at: item.lastModifiedDateTime,
          created_by: item.createdBy?.user?.displayName,
        },
      }))
    );
    return { entities, next_cursor: delta["@odata.deltaLink"] || delta["@odata.nextLink"] };
  }

  const res = await connector.listItems?.({
    top: opts.phase === "creamy" ? 10 : opts.limit || 100,
  });
  entities.push(
    ...(res?.value || []).map((item: any) => ({
      entity_type: "file",
      name: item.name,
      source: "onedrive",
      source_id: item.id,
      data: {
        size: item.size,
        web_url: item.webUrl,
        is_folder: !!item.folder,
        created_at: item.createdDateTime,
        modified_at: item.lastModifiedDateTime,
      },
    }))
  );

  return { entities };
}

// ── Twilio ───────────────────────────────────────────────────────────────────

export async function syncTwilio(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const page = opts.cursor ? parseInt(opts.cursor, 10) : 0;
  const pageSize = opts.phase === "creamy" ? 10 : opts.limit || 100;

  if (!opts.entityType || opts.entityType === "message") {
    const res = await connector.getMessages?.({
      Page: page,
      PageSize: pageSize,
      DateSent: opts.since,
    });
    const messages = res?.messages || [];
    entities.push(
      ...messages.map((m: any) => ({
        entity_type: "message",
        name: `${m.direction} message: ${m.from} → ${m.to}`,
        source: "twilio",
        source_id: m.sid,
        data: {
          from: m.from,
          to: m.to,
          body: m.body,
          status: m.status,
          direction: m.direction,
          date_created: m.date_created,
          date_sent: m.date_sent,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "call") {
    const res = await connector.getCalls?.({
      Page: page,
      PageSize: pageSize,
      StartTime: opts.since,
    });
    const calls = res?.calls || [];
    entities.push(
      ...calls.map((c: any) => ({
        entity_type: "call",
        name: `${c.direction} call: ${c.from} → ${c.to}`,
        source: "twilio",
        source_id: c.sid,
        data: {
          from: c.from,
          to: c.to,
          status: c.status,
          direction: c.direction,
          duration: c.duration,
          date_created: c.date_created,
        },
      }))
    );
  }

  return { entities };
}

// ── Freshbooks ───────────────────────────────────────────────────────────────

export async function syncFreshbooks(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const page = opts.cursor ? parseInt(opts.cursor, 10) : 1;
  const per_page = opts.phase === "creamy" ? 10 : opts.limit || 100;

  if (!opts.entityType || opts.entityType === "invoice") {
    const res = await connector.getInvoices?.({ page, per_page, updated_since: opts.since });
    const invoices = res?.invoices || [];
    entities.push(
      ...invoices.map((inv: any) => ({
        entity_type: "invoice",
        name: `Invoice ${inv.invoice_number || inv.invoiceid}`,
        source: "freshbooks",
        source_id: String(inv.id || inv.invoiceid),
        data: {
          invoice_number: inv.invoice_number,
          customer_id: inv.customerid,
          amount: inv.amount?.amount,
          currency: inv.amount?.code,
          outstanding: inv.outstanding?.amount,
          paid: inv.paid?.amount,
          status: inv.status,
          create_date: inv.create_date,
          due_date: inv.due_date,
          updated: inv.updated,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "contact") {
    const res = await connector.getClients?.({ page, per_page, updated_since: opts.since });
    const clients = res?.clients || [];
    entities.push(
      ...clients.map((c: any) => ({
        entity_type: "contact",
        name: `${c.fname || ""} ${c.lname || ""}`.trim() || c.organization || "Unknown",
        source: "freshbooks",
        source_id: String(c.id || c.userid),
        data: {
          organization: c.organization,
          first_name: c.fname,
          last_name: c.lname,
          email: c.email,
          phone: c.phone_business,
          updated: c.updated,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "expense") {
    const res = await connector.getExpenses?.({ page, per_page, updated_since: opts.since });
    const expenses = res?.expenses || [];
    entities.push(
      ...expenses.map((e: any) => ({
        entity_type: "expense",
        name: `${e.vendor || "Expense"} - ${e.category?.category || ""}`,
        source: "freshbooks",
        source_id: String(e.id || e.expenseid),
        data: {
          vendor: e.vendor,
          amount: e.amount?.amount,
          currency: e.amount?.code,
          category: e.category?.category,
          date: e.date,
          updated: e.updated,
        },
      }))
    );
  }

  return { entities };
}

// ── Xero ─────────────────────────────────────────────────────────────────────

export async function syncXero(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const modifiedSince = opts.since;

  if (!opts.entityType || opts.entityType === "invoice") {
    const res = await connector.getInvoices?.({
      modifiedSince,
      page: opts.cursor ? parseInt(opts.cursor, 10) : 1,
    });
    const invoices = res?.Invoices || [];
    entities.push(
      ...(opts.phase === "creamy" ? invoices.slice(0, 10) : invoices).map((inv: any) => ({
        entity_type: "invoice",
        name: `Invoice ${inv.InvoiceNumber || inv.InvoiceID}`,
        source: "xero",
        source_id: inv.InvoiceID,
        data: {
          invoice_number: inv.InvoiceNumber,
          type: inv.Type,
          contact_name: inv.Contact?.Name,
          total: inv.Total,
          amount_due: inv.AmountDue,
          status: inv.Status,
          date: inv.Date,
          due_date: inv.DueDate,
          currency: inv.CurrencyCode,
          updated_at: inv.UpdatedDateUTC,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "contact") {
    const res = await connector.getContacts?.({
      modifiedSince,
      page: opts.cursor ? parseInt(opts.cursor, 10) : 1,
    });
    const contacts = res?.Contacts || [];
    entities.push(
      ...(opts.phase === "creamy" ? contacts.slice(0, 10) : contacts).map((c: any) => ({
        entity_type: "contact",
        name: c.Name || "Unknown",
        source: "xero",
        source_id: c.ContactID,
        data: {
          email: c.EmailAddress,
          first_name: c.FirstName,
          last_name: c.LastName,
          is_customer: c.IsCustomer,
          is_supplier: c.IsSupplier,
          status: c.ContactStatus,
          updated_at: c.UpdatedDateUTC,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "transaction") {
    const res = await connector.getBankTransactions?.({
      modifiedSince,
      page: opts.cursor ? parseInt(opts.cursor, 10) : 1,
    });
    const transactions = res?.BankTransactions || [];
    entities.push(
      ...(opts.phase === "creamy" ? transactions.slice(0, 10) : transactions).map((t: any) => ({
        entity_type: "transaction",
        name: `${t.Type} - ${t.Contact?.Name || "Unknown"}`,
        source: "xero",
        source_id: t.BankTransactionID,
        data: {
          type: t.Type,
          contact_name: t.Contact?.Name,
          total: t.Total,
          date: t.Date,
          status: t.Status,
          updated_at: t.UpdatedDateUTC,
        },
      }))
    );
  }

  return { entities };
}

// ── Zoho CRM ─────────────────────────────────────────────────────────────────

export async function syncZohoCRM(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 200;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "contact") {
    const res = await connector.getContacts?.({ limit, cursor: opts.cursor });
    const contacts = res?.data || [];
    entities.push(
      ...contacts.map((c: any) => ({
        entity_type: "contact",
        name: `${c.First_Name || ""} ${c.Last_Name || ""}`.trim() || c.Email || "Unknown",
        source: "zoho-crm",
        source_id: c.id,
        data: {
          email: c.Email,
          phone: c.Phone,
          mobile: c.Mobile,
          lead_source: c.Lead_Source,
          lead_status: c.Lead_Status,
          account_name: c.Account_Name?.name,
          created_time: c.Created_Time,
          modified_time: c.Modified_Time,
        },
      }))
    );
    if (res?.next_cursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "account") {
    const res = await connector.getAccounts?.({ limit, cursor: opts.cursor });
    const accounts = res?.data || [];
    entities.push(
      ...accounts.map((a: any) => ({
        entity_type: "account",
        name: a.Account_Name || "Unknown",
        source: "zoho-crm",
        source_id: a.id,
        data: {
          website: a.Website,
          industry: a.Industry,
          billing_city: a.Billing_City,
          billing_country: a.Billing_Country,
          annual_revenue: a.Annual_Revenue,
          employees: a.Employees,
          created_time: a.Created_Time,
          modified_time: a.Modified_Time,
        },
      }))
    );
    if (res?.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "deal") {
    const res = await connector.getDeals?.({ limit, cursor: opts.cursor });
    const deals = res?.data || [];
    entities.push(
      ...deals.map((d: any) => ({
        entity_type: "deal",
        name: d.Deal_Name || "Untitled Deal",
        source: "zoho-crm",
        source_id: d.id,
        data: {
          amount: d.Amount,
          stage: d.Stage,
          probability: d.Probability,
          closing_date: d.Closing_Date,
          account_name: d.Account_Name?.name,
          contact_name: d.Contact_Name?.name,
          created_time: d.Created_Time,
          modified_time: d.Modified_Time,
        },
      }))
    );
    if (res?.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  return { entities, next_cursor: nextCursor };
}

// ── Help Scout ───────────────────────────────────────────────────────────────

export async function syncHelpScout(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "ticket") {
    const res = await connector.getConversations?.({ limit, cursor: opts.cursor });
    const conversations = res?.data || [];
    entities.push(
      ...conversations.map((c: any) => ({
        entity_type: "ticket",
        name: c.subject || `Conversation #${c.id}`,
        source: "helpscout",
        source_id: String(c.id),
        data: {
          status: c.status,
          priority: c.priority,
          mailbox_id: c.mailboxId,
          assignee: c.assignee?.email,
          customer_email: c.customer?.email,
          customer_name: c.customer?.firstName,
          created_at: c.createdAt,
          closed_at: c.closedAt,
        },
      }))
    );
    if (res?.next_cursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "contact") {
    const res = await connector.getCustomers?.({ limit, cursor: opts.cursor });
    const customers = res?.data || [];
    entities.push(
      ...customers.map((c: any) => ({
        entity_type: "contact",
        name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email || "Unknown",
        source: "helpscout",
        source_id: String(c.id),
        data: {
          email: c.email,
          phone: c.phone,
          company: c.company,
          created_at: c.createdAt,
        },
      }))
    );
    if (res?.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  return { entities, next_cursor: nextCursor };
}

// ── Front ────────────────────────────────────────────────────────────────────

export async function syncFront(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "ticket") {
    const res = await connector.getConversations?.({ limit, cursor: opts.cursor });
    const conversations = res?.data || [];
    entities.push(
      ...conversations.map((c: any) => ({
        entity_type: "ticket",
        name: c.subject || `Conversation ${c.id}`,
        source: "front",
        source_id: c.id,
        data: {
          status: c.status,
          assignee: c.assignee?.email,
          recipient: c.recipient?.handle,
          inbox_id: c.inbox_id,
          created_at: c.created_at,
          updated_at: c.updated_at,
        },
      }))
    );
    if (res?.next_cursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "contact") {
    const res = await connector.getContacts?.({ limit, cursor: opts.cursor });
    const contacts = res?.data || [];
    entities.push(
      ...contacts.map((c: any) => ({
        entity_type: "contact",
        name: c.name || c.handle || "Unknown",
        source: "front",
        source_id: c.id,
        data: {
          email: c.handle?.includes("@") ? c.handle : undefined,
          phone: c.handle?.includes("+") ? c.handle : undefined,
          description: c.description,
          created_at: c.created_at,
        },
      }))
    );
    if (res?.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  return { entities, next_cursor: nextCursor };
}

// ── Freshdesk ────────────────────────────────────────────────────────────────

export async function syncFreshdesk(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "ticket") {
    const res = await connector.getTickets?.({ limit, cursor: opts.cursor, since: opts.since });
    const tickets = res?.data || [];
    entities.push(
      ...tickets.map((t: any) => ({
        entity_type: "ticket",
        name: t.subject || `Ticket #${t.id}`,
        source: "freshdesk",
        source_id: String(t.id),
        data: {
          status: t.status,
          priority: t.priority,
          source: t.source,
          requester_email: t.requester_email,
          responder_id: t.responder_id,
          company_id: t.company_id,
          created_at: t.created_at,
          updated_at: t.updated_at,
          due_by: t.due_by,
        },
      }))
    );
    if (res?.next_cursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "contact") {
    const res = await connector.getContacts?.({ limit, cursor: opts.cursor });
    const contacts = res?.data || [];
    entities.push(
      ...contacts.map((c: any) => ({
        entity_type: "contact",
        name: c.name || c.email || "Unknown",
        source: "freshdesk",
        source_id: String(c.id),
        data: {
          email: c.email,
          phone: c.phone,
          mobile: c.mobile,
          company_id: c.company_id,
          created_at: c.created_at,
          updated_at: c.updated_at,
        },
      }))
    );
    if (res?.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "account") {
    const res = await connector.getCompanies?.({ limit, cursor: opts.cursor });
    const companies = res?.data || [];
    entities.push(
      ...companies.map((c: any) => ({
        entity_type: "account",
        name: c.name || "Unknown",
        source: "freshdesk",
        source_id: String(c.id),
        data: {
          description: c.description,
          note: c.note,
          domains: c.domains,
          created_at: c.created_at,
          updated_at: c.updated_at,
        },
      }))
    );
    if (res?.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  return { entities, next_cursor: nextCursor };
}

// ── Kustomer ─────────────────────────────────────────────────────────────────

export async function syncKustomer(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "contact") {
    const res = await connector.getCustomers?.({ limit, cursor: opts.cursor });
    const customers = res?.data || [];
    entities.push(
      ...customers.map((c: any) => ({
        entity_type: "contact",
        name: c.attributes?.name || c.attributes?.email || "Unknown",
        source: "kustomer",
        source_id: c.id,
        data: {
          email: c.attributes?.email,
          phone: c.attributes?.phones?.[0]?.phone,
          external_id: c.attributes?.externalId,
          created_at: c.attributes?.createdAt,
          updated_at: c.attributes?.updatedAt,
        },
      }))
    );
    if (res?.next_cursor) nextCursor = res.next_cursor;
  }

  if (!opts.entityType || opts.entityType === "ticket") {
    const res = await connector.getConversations?.({ limit, cursor: opts.cursor });
    const conversations = res?.data || [];
    entities.push(
      ...conversations.map((c: any) => ({
        entity_type: "ticket",
        name: c.attributes?.name || c.attributes?.subject || `Conversation ${c.id}`,
        source: "kustomer",
        source_id: c.id,
        data: {
          status: c.attributes?.status,
          priority: c.attributes?.priority,
          customer_id: c.relationships?.customer?.data?.id,
          assigned_user: c.relationships?.assignedUser?.data?.id,
          created_at: c.attributes?.createdAt,
          updated_at: c.attributes?.updatedAt,
        },
      }))
    );
    if (res?.next_cursor && !nextCursor) nextCursor = res.next_cursor;
  }

  return { entities, next_cursor: nextCursor };
}

// ── WhatsApp Business ────────────────────────────────────────────────────────

export async function syncWhatsAppBusiness(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;
  const entities: NormalizedEntity[] = [];
  let nextCursor: string | undefined;

  if (!opts.entityType || opts.entityType === "interaction_event") {
    const res = await connector.getMessages?.({ limit, cursor: opts.cursor });
    const messages = res?.data || [];
    entities.push(
      ...messages.map((m: any) => ({
        entity_type: "interaction_event",
        name: m.type || `Message ${m.id}`,
        source: "whatsapp-business",
        source_id: m.id,
        data: {
          from: m.from,
          to: m.to,
          type: m.type,
          timestamp: m.timestamp,
          status: m.status,
          conversation_id: m.conversation?.id,
        },
      }))
    );
    if (res?.next_cursor) nextCursor = res.next_cursor;
  }

  return { entities, next_cursor: nextCursor };
}

// ── Discord ──────────────────────────────────────────────────────────────────

export async function syncDiscord(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;

  if (!opts.entityType || opts.entityType === "channel") {
    const guilds = (await connector.getGuilds?.()) || [];
    for (const guild of guilds.slice(0, opts.phase === "creamy" ? 3 : guilds.length)) {
      const channels = (await connector.getChannels?.(guild.id)) || [];
      entities.push(
        ...channels.slice(0, limit).map((ch: any) => ({
          entity_type: "channel" as const,
          name: ch.name || `Channel ${ch.id}`,
          source: "discord",
          source_id: ch.id,
          data: {
            guild_id: guild.id,
            guild_name: guild.name,
            type: ch.type,
            topic: ch.topic,
            position: ch.position,
            parent_id: ch.parent_id,
          },
        }))
      );
    }
  }

  if (!opts.entityType || opts.entityType === "member") {
    const guilds = (await connector.getGuilds?.()) || [];
    for (const guild of guilds.slice(0, opts.phase === "creamy" ? 1 : guilds.length)) {
      const members = (await connector.getMembers?.(guild.id, { limit })) || [];
      entities.push(
        ...members.map((m: any) => ({
          entity_type: "member" as const,
          name: m.user?.username || m.nick || `Member ${m.user?.id}`,
          source: "discord",
          source_id: m.user?.id || m.nick,
          data: {
            guild_id: guild.id,
            nick: m.nick,
            roles: m.roles,
            joined_at: m.joined_at,
            avatar: m.user?.avatar,
          },
        }))
      );
    }
  }

  return { entities };
}

// ── Microsoft Teams ──────────────────────────────────────────────────────────

export async function syncMicrosoftTeams(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;

  if (!opts.entityType || opts.entityType === "team") {
    const teams = (await connector.getJoinedTeams?.()) || [];
    entities.push(
      ...teams.slice(0, limit).map((t: any) => ({
        entity_type: "team" as const,
        name: t.displayName || `Team ${t.id}`,
        source: "microsoft-teams",
        source_id: t.id,
        data: {
          description: t.description,
          visibility: t.visibility,
          isArchived: t.isArchived,
          createdDateTime: t.createdDateTime,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "channel") {
    const teams = (await connector.getJoinedTeams?.()) || [];
    for (const team of teams.slice(0, opts.phase === "creamy" ? 3 : teams.length)) {
      const channels = (await connector.getChannels?.(team.id)) || [];
      entities.push(
        ...channels.slice(0, limit).map((ch: any) => ({
          entity_type: "channel" as const,
          name: ch.displayName || `Channel ${ch.id}`,
          source: "microsoft-teams",
          source_id: ch.id,
          data: {
            team_id: team.id,
            team_name: team.displayName,
            membershipType: ch.membershipType,
            createdDateTime: ch.createdDateTime,
          },
        }))
      );
    }
  }

  if (!opts.entityType || opts.entityType === "user") {
    const usersRes = (await connector.getUsers?.({ $top: limit })) || { value: [] };
    entities.push(
      ...usersRes.value.map((u: any) => ({
        entity_type: "user" as const,
        name: u.displayName || u.userPrincipalName,
        source: "microsoft-teams",
        source_id: u.id,
        data: {
          email: u.mail,
          jobTitle: u.jobTitle,
          department: u.department,
          accountEnabled: u.accountEnabled,
        },
      }))
    );
  }

  return { entities };
}

// ── Zoom ─────────────────────────────────────────────────────────────────────

export async function syncZoom(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 100;

  if (!opts.entityType || opts.entityType === "user") {
    const usersRes = (await connector.getUsers?.({ page_size: limit })) || { users: [] };
    entities.push(
      ...(usersRes.users || []).map((u: any) => ({
        entity_type: "user" as const,
        name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
        source: "zoom",
        source_id: u.id,
        data: {
          email: u.email,
          type: u.type,
          status: u.status,
          role_name: u.role_name,
          department: u.dept,
          created_at: u.created_at,
          last_login_time: u.last_login_time,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "meeting") {
    const meetingsRes = (await connector.getMeetings?.("me", { page_size: limit })) || {
      meetings: [],
    };
    entities.push(
      ...(meetingsRes.meetings || []).map((m: any) => ({
        entity_type: "meeting" as const,
        name: m.topic || `Meeting ${m.id}`,
        source: "zoom",
        source_id: String(m.id),
        data: {
          type: m.type,
          start_time: m.start_time,
          duration: m.duration,
          timezone: m.timezone,
          status: m.status,
          join_url: m.join_url,
          host_id: m.host_id,
          created_at: m.created_at,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "recording") {
    const recordingsRes = (await connector.getRecordings?.("me", {
      page_size: Math.min(limit, 30),
    })) || { meetings: [] };
    entities.push(
      ...(recordingsRes.meetings || []).map((r: any) => ({
        entity_type: "recording" as const,
        name: r.topic || `Recording ${r.uuid}`,
        source: "zoom",
        source_id: r.uuid,
        data: {
          meeting_id: r.meeting_id,
          start_time: r.start_time,
          duration: r.duration,
          total_size: r.total_size,
          recording_count: r.recording_count,
          host_email: r.host_email,
        },
      }))
    );
  }

  return { entities };
}

// ── GitLab ───────────────────────────────────────────────────────────────────

export async function syncGitLab(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;

  if (!opts.entityType || opts.entityType === "repository") {
    const projects =
      (await connector.listProjects?.({
        per_page: limit,
        membership: true,
        updated_after: opts.since,
      })) || [];
    entities.push(
      ...projects.map((p: any) => ({
        entity_type: "repository" as const,
        name: p.name_with_namespace || p.name,
        source: "gitlab",
        source_id: String(p.id),
        data: {
          path: p.path_with_namespace,
          description: p.description,
          web_url: p.web_url,
          default_branch: p.default_branch,
          visibility: p.visibility,
          star_count: p.star_count,
          forks_count: p.forks_count,
          open_issues_count: p.open_issues_count,
          last_activity_at: p.last_activity_at,
          created_at: p.created_at,
          archived: p.archived,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "issue") {
    const projects =
      (await connector.listProjects?.({
        per_page: opts.phase === "creamy" ? 3 : 10,
        membership: true,
      })) || [];
    for (const project of projects) {
      const issues =
        (await connector.listProjectIssues?.(project.id, {
          per_page: limit,
          updated_after: opts.since,
        })) || [];
      entities.push(
        ...issues.map((i: any) => ({
          entity_type: "issue" as const,
          name: i.title || `Issue #${i.iid}`,
          source: "gitlab",
          source_id: `${project.id}-${i.iid}`,
          data: {
            project_id: project.id,
            project_name: project.name,
            iid: i.iid,
            state: i.state,
            author: i.author?.username,
            assignees: i.assignees?.map((a: any) => a.username),
            labels: i.labels,
            milestone: i.milestone?.title,
            due_date: i.due_date,
            weight: i.weight,
            web_url: i.web_url,
            created_at: i.created_at,
            updated_at: i.updated_at,
          },
        }))
      );
    }
  }

  if (!opts.entityType || opts.entityType === "merge_request") {
    const projects =
      (await connector.listProjects?.({
        per_page: opts.phase === "creamy" ? 3 : 10,
        membership: true,
      })) || [];
    for (const project of projects) {
      const mrs =
        (await connector.listProjectMergeRequests?.(project.id, {
          per_page: limit,
          updated_after: opts.since,
        })) || [];
      entities.push(
        ...mrs.map((mr: any) => ({
          entity_type: "merge_request" as const,
          name: mr.title || `MR !${mr.iid}`,
          source: "gitlab",
          source_id: `${project.id}-mr-${mr.iid}`,
          data: {
            project_id: project.id,
            project_name: project.name,
            iid: mr.iid,
            state: mr.state,
            source_branch: mr.source_branch,
            target_branch: mr.target_branch,
            author: mr.author?.username,
            draft: mr.draft,
            has_conflicts: mr.has_conflicts,
            web_url: mr.web_url,
            created_at: mr.created_at,
            updated_at: mr.updated_at,
            merged_at: mr.merged_at,
          },
        }))
      );
    }
  }

  return { entities };
}

// ── Bitbucket ────────────────────────────────────────────────────────────────

export async function syncBitbucket(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const limit = opts.phase === "creamy" ? 10 : opts.limit || 50;

  if (!opts.entityType || opts.entityType === "repository") {
    const reposRes = (await connector.listRepositories?.(undefined, { pagelen: limit })) || {
      values: [],
    };
    entities.push(
      ...(reposRes.values || []).map((r: any) => ({
        entity_type: "repository" as const,
        name: r.full_name || r.name,
        source: "bitbucket",
        source_id: r.uuid,
        data: {
          slug: r.slug,
          full_name: r.full_name,
          description: r.description,
          language: r.language,
          is_private: r.is_private,
          mainbranch: r.mainbranch?.name,
          size: r.size,
          has_issues: r.has_issues,
          web_url: r.links?.html?.href,
          created_on: r.created_on,
          updated_on: r.updated_on,
        },
      }))
    );
  }

  if (!opts.entityType || opts.entityType === "pull_request") {
    const reposRes = (await connector.listRepositories?.(undefined, {
      pagelen: opts.phase === "creamy" ? 3 : 10,
    })) || { values: [] };
    for (const repo of reposRes.values || []) {
      const workspace = repo.full_name?.split("/")[0];
      if (!workspace) continue;
      const prsRes = (await connector.listPullRequests?.(workspace, repo.slug, {
        pagelen: limit,
      })) || { values: [] };
      entities.push(
        ...(prsRes.values || []).map((pr: any) => ({
          entity_type: "pull_request" as const,
          name: pr.title || `PR #${pr.id}`,
          source: "bitbucket",
          source_id: `${repo.uuid}-pr-${pr.id}`,
          data: {
            repo_name: repo.full_name,
            id: pr.id,
            state: pr.state,
            author: pr.author?.display_name,
            source_branch: pr.source?.branch?.name,
            destination_branch: pr.destination?.branch?.name,
            comment_count: pr.comment_count,
            task_count: pr.task_count,
            web_url: pr.links?.html?.href,
            created_on: pr.created_on,
            updated_on: pr.updated_on,
          },
        }))
      );
    }
  }

  return { entities };
}

// ── Dropbox ──────────────────────────────────────────────────────────────────

export async function syncDropbox(connector: any, opts: SyncOptions): Promise<SyncResult> {
  const entities: NormalizedEntity[] = [];
  const limit = opts.phase === "creamy" ? 20 : opts.limit || 200;

  // For delta sync, use cursor-based listing
  if (opts.phase === "delta" && opts.cursor) {
    const result = (await connector.listFolderContinue?.(opts.cursor)) || {
      entries: [],
      has_more: false,
      cursor: opts.cursor,
    };
    entities.push(
      ...result.entries.slice(0, limit).map((entry: any) => ({
        entity_type: "file" as const,
        name: entry.name || "Unknown",
        source: "dropbox",
        source_id: entry.id || entry.path_lower,
        data: {
          tag: entry[".tag"],
          path_display: entry.path_display,
          path_lower: entry.path_lower,
          size: entry.size,
          server_modified: entry.server_modified,
          client_modified: entry.client_modified,
          rev: entry.rev,
          content_hash: entry.content_hash,
        },
      }))
    );
    return { entities, next_cursor: result.has_more ? result.cursor : undefined };
  }

  // For creamy/needed, list root folder
  const result = (await connector.listFolder?.("", {
    recursive: opts.phase !== "creamy",
    limit,
  })) || { entries: [], has_more: false, cursor: "" };
  entities.push(
    ...result.entries.slice(0, limit).map((entry: any) => ({
      entity_type: "file" as const,
      name: entry.name || "Unknown",
      source: "dropbox",
      source_id: entry.id || entry.path_lower,
      data: {
        tag: entry[".tag"],
        path_display: entry.path_display,
        path_lower: entry.path_lower,
        size: entry.size,
        server_modified: entry.server_modified,
        client_modified: entry.client_modified,
        rev: entry.rev,
        content_hash: entry.content_hash,
      },
    }))
  );

  return {
    entities,
    next_cursor: result.has_more ? result.cursor : undefined,
  };
}

// ── Registry: provider name → sync function ──────────────────────────────────

export const SYNC_REGISTRY: Record<
  string,
  (connector: any, opts: SyncOptions) => Promise<SyncResult>
> = {
  hubspot: syncHubSpot,
  "hubspot-marketing": syncHubSpotMarketing,
  salesforce: syncSalesforce,
  pipedrive: syncPipedrive,
  freshsales: syncFreshsales,
  close: syncClose,
  stripe: syncStripe,
  chargebee: syncChargebee,
  github: syncGitHub,
  jira: syncJira,
  notion: syncNotion,
  slack: syncSlack,
  gmail: syncGmail,
  outlook: syncOutlook,
  linear: syncLinear,
  zendesk: syncZendesk,
  intercom: syncIntercom,
  "google-drive": syncGoogleDrive,
  "google-sheets": syncGoogleSheets,
  tally: syncTally,
  razorpay: syncRazorpay,
  vyapar: syncVyapar,
  khatabook: syncKhatabook,
  shiprocket: syncShiprocket,
  quickbooks: syncQuickBooks,
  shopify: syncShopify,
  mailchimp: syncMailchimp,
  sendgrid: syncSendGrid,
  braze: syncBraze,
  marketo: syncMarketo,
  "customer-io": syncCustomerIO,
  heap: syncHeap,
  amplitude: syncAmplitude,
  airtable: syncAirtable,
  mixpanel: syncMixpanel,
  "google-analytics": syncGoogleAnalytics,
  tableau: syncTableau,
  xero: syncXero,
  freshbooks: syncFreshbooks,
  metabase: syncMetabase,
  paddle: syncPaddle,
  woocommerce: syncWooCommerce,
  bigcommerce: syncBigCommerce,
  onedrive: syncOneDrive,
  twilio: syncTwilio,
  "zoho-crm": syncZohoCRM,
  helpscout: syncHelpScout,
  front: syncFront,
  freshdesk: syncFreshdesk,
  kustomer: syncKustomer,
  "whatsapp-business": syncWhatsAppBusiness,
  // New Product + Engineering connectors
  discord: syncDiscord,
  "microsoft-teams": syncMicrosoftTeams,
  zoom: syncZoom,
  gitlab: syncGitLab,
  bitbucket: syncBitbucket,
  dropbox: syncDropbox,
};

/**
 * Universal sync: resolve provider name to the correct sync function and execute.
 * Returns normalized entities ready for the Spine pipeline.
 */
export async function universalSync(
  provider: string,
  connector: any,
  opts: SyncOptions = {}
): Promise<SyncResult> {
  const syncFn = SYNC_REGISTRY[provider.toLowerCase()];
  if (!syncFn) return { entities: [] };
  return syncFn(connector, opts);
}
