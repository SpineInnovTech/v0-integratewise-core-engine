import { describe, it, expect } from "vitest";
import {
  mapRepository,
  mapIssue,
  mapPullRequest,
  mapCommit,
  mapContributor,
  mapGitHubBatch,
  isPullRequestIssue,
} from "./github-spine-mapping";

// Canonical entity-type universe this proof targets (PRODUCT_ENGINEERING + Person).
const CANONICAL = new Set(["repository", "task", "pull_request", "activity", "contact"]);

describe("GitHub → Spine canonical mapping", () => {
  it("maps a repository to canonical 'repository' with provenance, no raw blob", () => {
    const e = mapRepository({
      id: 123,
      name: "integratewise-live",
      full_name: "NirmalPrinceJ/integratewise-live",
      language: "TypeScript",
      stargazers_count: 7,
      open_issues_count: 3,
      html_url: "https://github.com/x/y",
      archived: false,
      pushed_at: "2026-06-12T00:00:00Z",
    });
    expect(e.entity_type).toBe("repository");
    expect(e.source).toBe("github");
    expect(e.source_id).toBe("123");
    expect(e.name).toBe("integratewise-live");
    expect(e.data.language).toBe("TypeScript");
    expect(e.data.status).toBe("active");
    // No raw GitHub fields leak through (provenance + canonical fields only).
    expect((e.data as any).stargazers_count).toBeUndefined();
  });

  it("maps an issue to canonical 'task' and flags blocked work via labels", () => {
    const e = mapIssue({
      id: 9,
      number: 42,
      title: "Fix auth race",
      state: "open",
      labels: [{ name: "bug" }, { name: "blocked" }],
      assignee: { login: "nirmal" },
    });
    expect(e.entity_type).toBe("task");
    expect(e.source_id).toBe("9");
    expect(e.data.assignee).toBe("nirmal");
    expect(e.data.blocked_by).toBe("label:blocked");
    expect(e.data.labels).toEqual(["bug", "blocked"]);
  });

  it("maps a pull request to canonical 'pull_request' with merged/draft status", () => {
    const merged = mapPullRequest({
      id: 1,
      number: 5,
      title: "Add Spine",
      merged_at: "2026-06-10T00:00:00Z",
      user: { login: "a" },
    });
    expect(merged.entity_type).toBe("pull_request");
    expect(merged.data.status).toBe("merged");
    expect(merged.data.author).toBe("a");

    const draft = mapPullRequest({ id: 2, number: 6, title: "WIP", draft: true, state: "open" });
    expect(draft.data.status).toBe("draft");
  });

  it("maps a commit to canonical 'activity' (commit)", () => {
    const e = mapCommit({
      sha: "abcdef1234567890",
      commit: {
        message: "fix: spine writer\n\nbody",
        author: { name: "Nirmal", date: "2026-06-11T00:00:00Z" },
      },
      author: { login: "nirmal" },
    });
    expect(e.entity_type).toBe("activity");
    expect(e.data.activity_type).toBe("commit");
    expect(e.name).toBe("fix: spine writer");
    expect(e.data.author).toBe("nirmal");
  });

  it("maps a contributor to canonical 'contact' (a Person)", () => {
    const e = mapContributor({
      id: 77,
      login: "nirmal",
      name: "Nirmal Prince",
      contributions: 256,
    });
    expect(e.entity_type).toBe("contact");
    expect(e.data.handle).toBe("nirmal");
    expect(e.data.role).toBe("contributor");
  });

  it("detects PRs disguised as issues (GitHub issues API returns PRs)", () => {
    expect(isPullRequestIssue({ pull_request: { url: "x" } })).toBe(true);
    expect(isPullRequestIssue({})).toBe(false);
  });

  it("batch maps mixed payloads and routes PR-issues to pull_request", () => {
    const entities = mapGitHubBatch({
      repos: [{ id: 1, name: "r" }],
      issues: [
        { id: 2, number: 1, title: "real issue", state: "open" },
        { id: 3, number: 2, title: "actually a PR", pull_request: { url: "x" } },
      ],
      pullRequests: [{ id: 4, number: 3, title: "explicit PR" }],
      commits: [{ sha: "deadbeef", commit: { message: "chore" } }],
      contributors: [{ id: 5, login: "dev" }],
    });

    // Every emitted entity uses a canonical type — no raw/unknown types.
    for (const e of entities) {
      expect(CANONICAL.has(e.entity_type)).toBe(true);
      expect(e.source).toBe("github");
      expect(e.source_id).toBeTruthy();
    }

    const byType = entities.reduce<Record<string, number>>((acc, e) => {
      acc[e.entity_type] = (acc[e.entity_type] || 0) + 1;
      return acc;
    }, {});
    expect(byType.repository).toBe(1);
    expect(byType.task).toBe(1); // the real issue
    expect(byType.pull_request).toBe(2); // disguised PR-issue + explicit PR
    expect(byType.activity).toBe(1); // commit
    expect(byType.contact).toBe(1); // contributor
  });
});
