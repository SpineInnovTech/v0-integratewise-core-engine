/**
 * Real-data demo: GitHub → canonical Spine entities → Engineering projection → Twin answer.
 *
 * Uses the ACTUAL committed mapper (packages/connectors/.../github-spine-mapping.ts) on
 * LIVE public GitHub data — no deploy, no mocks. The projection bucketing + Twin context
 * mirror services/gateway getEngineeringProjection and iw-agent-runtime spineReadEngineering.
 *
 * Run:  node scripts/demo/github-engineering-demo.mjs [owner/repo]
 */
import { mapGitHubBatch } from "../../packages/connectors/src/project-management/github-spine-mapping.ts";

const REPO = process.argv[2] || "cloudflare/workers-sdk";
const [owner, repo] = REPO.split("/");
const GH = "https://api.github.com";
const headers = { Accept: "application/vnd.github+json", "User-Agent": "iw-engineering-demo" };

async function gh(path) {
  const res = await fetch(`${GH}${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub ${path} → ${res.status}`);
  return res.json();
}

function bucket(entities) {
  // Mirrors getEngineeringProjection / spineReadEngineering shaping.
  const out = { activeRepositories: [], openPullRequests: [], recentCommits: [], blockedWork: [] };
  for (const e of entities) {
    const d = e.data || {};
    const base = { name: e.name, sourceId: e.source_id };
    if (e.entity_type === "repository" && d.status !== "archived")
      out.activeRepositories.push({ ...base, language: d.language, stars: d.stars });
    else if (e.entity_type === "pull_request" && (d.status === "open" || d.status === "draft"))
      out.openPullRequests.push({ ...base, status: d.status, author: d.author });
    else if (e.entity_type === "activity" && d.activity_type === "commit")
      out.recentCommits.push({ ...base, author: d.author });
    else if (e.entity_type === "task" && d.blocked_by)
      out.blockedWork.push({ ...base, assignee: d.assignee, blockedBy: d.blocked_by });
  }
  out.counts = {
    repositories: out.activeRepositories.length,
    openPRs: out.openPullRequests.length,
    commits: out.recentCommits.length,
    blocked: out.blockedWork.length,
  };
  return out;
}

function twinContext(e) {
  const repos = e.activeRepositories
    .map((r) => r.name)
    .slice(0, 6)
    .join(", ");
  const prs = e.openPullRequests
    .map((p) => `${p.name} (@${p.author}, ${p.status})`)
    .slice(0, 6)
    .join("; ");
  const commits = e.recentCommits
    .map((c) => c.name)
    .slice(0, 6)
    .join("; ");
  const blocked =
    e.blockedWork
      .map((b) => b.name)
      .slice(0, 6)
      .join("; ") || "none";
  return [
    `Engineering projection (from SPINE build_data — not a live tool query):`,
    `- Active repositories (${e.counts.repositories}): ${repos || "none"}`,
    `- Open pull requests (${e.counts.openPRs}): ${prs || "none"}`,
    `- Recent commits (${e.counts.commits}): ${commits || "none"}`,
    `- Blocked work (${e.counts.blocked}): ${blocked}`,
  ].join("\n");
}

const line = (t) => console.log("\n" + "─".repeat(72) + "\n" + t);

console.log(`\n🌱 IntegrateWise — Real-data engineering pipeline demo`);
console.log(`   Source: github.com/${REPO}  (live public data, real committed mapper)`);

const [repoData, issues, pulls, commits, contributors] = await Promise.all([
  gh(`/repos/${owner}/${repo}`),
  gh(`/repos/${owner}/${repo}/issues?state=open&per_page=15`),
  gh(`/repos/${owner}/${repo}/pulls?state=open&per_page=15`),
  gh(`/repos/${owner}/${repo}/commits?per_page=10`),
  gh(`/repos/${owner}/${repo}/contributors?per_page=8`),
]);

line(`STAGE 1 — Raw GitHub reality (external)`);
console.log(`  repo: ${repoData.full_name} · ${repoData.stargazers_count}★ · ${repoData.language}`);
console.log(
  `  open issues(+PRs from issues API): ${issues.length} · open pulls: ${pulls.length} · commits: ${commits.length} · contributors: ${contributors.length}`
);

const entities = mapGitHubBatch({
  repos: [repoData],
  issues,
  pullRequests: pulls,
  commits,
  contributors,
});

line(`STAGE 2 — Canonical Spine entities (via real mapGitHubBatch)`);
const byType = entities.reduce((a, e) => ((a[e.entity_type] = (a[e.entity_type] || 0) + 1), a), {});
console.log(`  ${entities.length} entities → ` + JSON.stringify(byType));
console.log(
  `  (every entity is a canonical type with source/source_id provenance — no raw GitHub records)`
);

const projection = bucket(entities);
line(`STAGE 3 — Engineering projection (build_data shape)`);
console.log("  counts:", JSON.stringify(projection.counts));

line(`STAGE 4 — What the Twin sees when asked "what changed in engineering this week?"`);
console.log(twinContext(projection));
console.log(
  "\n✅ End-to-end on REAL data — no deploy, no GitHub call from the Twin (it reads the Spine).\n"
);
