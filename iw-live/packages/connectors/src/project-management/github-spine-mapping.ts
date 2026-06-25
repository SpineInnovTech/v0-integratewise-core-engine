/**
 * GitHub → Spine canonical entity mapping.
 *
 * The Connector Runtime Proof (docs/architecture/CONNECTOR_RUNTIME_PROOF.md):
 * external reality (GitHub REST payloads) is normalized into CANONICAL Spine
 * entity types — never raw GitHub records exposed downstream.
 *
 * Canonical types (packages/types `ALL_CANONICAL_ENTITY_TYPES`, PRODUCT_ENGINEERING):
 *   repo         → "repository"
 *   issue        → "task"          (an engineering work item; GitHub PRs excluded)
 *   pull request → "pull_request"
 *   commit       → "activity"      (matches the canonical `push → activity` alias)
 *   contributor  → "contact"       (a contributor is a Person; entity resolution unifies them)
 *
 * These are pure functions: no network, no side effects — unit-testable offline.
 * The runtime (live sync → normalizer → Spine D1) wires these in connector-sync.
 */

export interface NormalizedEntity {
  entity_type: string;
  name: string;
  source: string;
  source_id: string;
  data: Record<string, unknown>;
}

const SOURCE = "github";

/** A GitHub "issue" object is a pull request iff it carries a `pull_request` field. */
export function isPullRequestIssue(issue: { pull_request?: unknown }): boolean {
  return Boolean(issue && issue.pull_request);
}

export function mapRepository(repo: {
  id: number | string;
  name?: string;
  full_name?: string;
  language?: string | null;
  stargazers_count?: number;
  open_issues_count?: number;
  html_url?: string;
  default_branch?: string;
  archived?: boolean;
  pushed_at?: string;
  updated_at?: string;
}): NormalizedEntity {
  return {
    entity_type: "repository",
    name: repo.name || repo.full_name || `repo-${repo.id}`,
    source: SOURCE,
    source_id: String(repo.id),
    data: {
      full_name: repo.full_name ?? null,
      language: repo.language ?? null,
      stars: repo.stargazers_count ?? 0,
      open_issues: repo.open_issues_count ?? 0,
      url: repo.html_url ?? null,
      default_branch: repo.default_branch ?? null,
      status: repo.archived ? "archived" : "active",
      last_activity: repo.pushed_at || repo.updated_at || null,
    },
  };
}

export function mapIssue(issue: {
  id: number | string;
  number?: number;
  title?: string;
  state?: string;
  labels?: Array<{ name?: string } | string>;
  assignee?: { login?: string } | null;
  html_url?: string;
  created_at?: string;
  updated_at?: string;
}): NormalizedEntity {
  const labels = (issue.labels || [])
    .map((l) => (typeof l === "string" ? l : l?.name))
    .filter(Boolean);
  const blocked = labels.some((l) => /blocked|blocker/i.test(String(l)));
  return {
    entity_type: "task",
    name: issue.title || `issue-${issue.number ?? issue.id}`,
    source: SOURCE,
    source_id: String(issue.id),
    data: {
      number: issue.number ?? null,
      status: issue.state ?? null,
      labels,
      blocked_by: blocked ? "label:blocked" : null,
      assignee: issue.assignee?.login ?? null,
      url: issue.html_url ?? null,
      due_date: null,
      created_at: issue.created_at ?? null,
    },
  };
}

export function mapPullRequest(pr: {
  id: number | string;
  number?: number;
  title?: string;
  state?: string;
  draft?: boolean;
  merged_at?: string | null;
  user?: { login?: string } | null;
  html_url?: string;
  base?: { ref?: string };
  head?: { ref?: string };
  created_at?: string;
}): NormalizedEntity {
  const status = pr.merged_at ? "merged" : pr.draft ? "draft" : pr.state || "open";
  return {
    entity_type: "pull_request",
    name: pr.title || `PR #${pr.number ?? pr.id}`,
    source: SOURCE,
    source_id: String(pr.id),
    data: {
      number: pr.number ?? null,
      status,
      author: pr.user?.login ?? null,
      base_branch: pr.base?.ref ?? null,
      head_branch: pr.head?.ref ?? null,
      url: pr.html_url ?? null,
      created_at: pr.created_at ?? null,
    },
  };
}

export function mapCommit(commit: {
  sha?: string;
  commit?: { message?: string; author?: { name?: string; date?: string } };
  author?: { login?: string } | null;
  html_url?: string;
}): NormalizedEntity {
  const message = commit.commit?.message || "";
  return {
    entity_type: "activity",
    name: message.split("\n")[0]?.slice(0, 120) || `commit ${commit.sha?.slice(0, 7) ?? ""}`,
    source: SOURCE,
    source_id: String(commit.sha ?? ""),
    data: {
      activity_type: "commit",
      sha: commit.sha ?? null,
      author: commit.author?.login || commit.commit?.author?.name || null,
      event_date: commit.commit?.author?.date ?? null,
      url: commit.html_url ?? null,
    },
  };
}

export function mapContributor(user: {
  id?: number | string;
  login?: string;
  name?: string | null;
  email?: string | null;
  contributions?: number;
  html_url?: string;
  type?: string;
}): NormalizedEntity {
  return {
    entity_type: "contact",
    name: user.name || user.login || `user-${user.id}`,
    source: SOURCE,
    source_id: String(user.id ?? user.login ?? ""),
    data: {
      handle: user.login ?? null,
      full_name: user.name ?? null,
      email: user.email ?? null,
      contributions: user.contributions ?? null,
      url: user.html_url ?? null,
      role: "contributor",
    },
  };
}

/**
 * Map a batch of GitHub payloads to canonical entities. Issues that are actually
 * pull requests are routed to mapPullRequest; everything else stays an issue/task.
 */
export function mapGitHubBatch(input: {
  repos?: any[];
  issues?: any[];
  pullRequests?: any[];
  commits?: any[];
  contributors?: any[];
}): NormalizedEntity[] {
  const out: NormalizedEntity[] = [];
  for (const r of input.repos || []) out.push(mapRepository(r));
  for (const i of input.issues || []) {
    if (isPullRequestIssue(i)) out.push(mapPullRequest(i));
    else out.push(mapIssue(i));
  }
  for (const p of input.pullRequests || []) out.push(mapPullRequest(p));
  for (const c of input.commits || []) out.push(mapCommit(c));
  for (const u of input.contributors || []) out.push(mapContributor(u));
  return out;
}
