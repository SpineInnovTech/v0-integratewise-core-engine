import { describe, it, expect } from "vitest";
import { getEngineeringProjection } from "./workspace-spine";

/** Minimal D1 mock returning fixed build_data rows. */
function mockEnv(rows: any[] | null) {
  return {
    DB: {
      prepare() {
        return {
          bind() {
            return {
              all: async () => {
                if (rows === null) throw new Error("no such table: build_data");
                return { results: rows };
              },
            };
          },
        };
      },
    },
  } as any;
}

const row = (
  type: string,
  name: string,
  data: Record<string, unknown>,
  extra: Record<string, unknown> = {}
) => ({
  id: `${type}-${name}`,
  type,
  name,
  status: "active",
  data: JSON.stringify(data),
  source_id: name,
  updated_at: "2026-06-12T00:00:00Z",
  ...extra,
});

describe("Engineering projection (read path from build_data)", () => {
  it("buckets canonical entities into repos / open PRs / commits / blocked work", async () => {
    const env = mockEnv([
      row("repository", "live", { language: "TypeScript", stars: 7, status: "active", url: "u" }),
      row("repository", "archived-repo", { status: "archived" }),
      row("pull_request", "open-pr", { status: "open", author: "a", head_branch: "feat" }),
      row("pull_request", "merged-pr", { status: "merged", author: "b" }),
      row("activity", "commit1", { activity_type: "commit", sha: "abc", author: "a" }),
      row("activity", "not-a-commit", { activity_type: "login" }),
      row("task", "blocked-task", { status: "open", blocked_by: "label:blocked", assignee: "a" }),
      row("task", "normal-task", { status: "open" }),
    ]);

    const res = await getEngineeringProjection(env, "tenant-1");
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.source).toBe("spine:build_data");

    // Active repos exclude archived.
    expect(body.counts.repositories).toBe(1);
    expect(body.activeRepositories[0].name).toBe("live");

    // Only open/draft PRs (merged excluded).
    expect(body.counts.openPRs).toBe(1);
    expect(body.openPullRequests[0].name).toBe("open-pr");

    // Only commit-activities.
    expect(body.counts.commits).toBe(1);
    expect(body.recentCommits[0].sha).toBe("abc");

    // Only blocked tasks.
    expect(body.counts.blocked).toBe(1);
    expect(body.blockedWork[0].blockedBy).toBe("label:blocked");
  });

  it("returns a graceful empty projection when build_data is absent (pre-sync)", async () => {
    const res = await getEngineeringProjection(mockEnv(null), "tenant-1");
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body.counts).toEqual({ repositories: 0, openPRs: 0, commits: 0, blocked: 0 });
    expect(body.activeRepositories).toEqual([]);
  });

  it("never surfaces raw records — only projected fields", async () => {
    const env = mockEnv([
      row("repository", "live", { language: "Go", stars: 3, url: "u", raw_secret: "LEAK" }),
    ]);
    const body = (await (await getEngineeringProjection(env, "t")).json()) as any;
    const repo = body.activeRepositories[0];
    expect(repo.language).toBe("Go");
    expect(Object.prototype.hasOwnProperty.call(repo, "raw_secret")).toBe(false);
  });
});
