import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// GitHub Connector — GitHub REST API (2022-11-28)
// ============================================================================

export interface GitHubConfig extends ConnectorConfig {
  token: string; // PAT or GitHub App installation token
  baseUrl?: string; // For GitHub Enterprise
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: { login: string; id: number; avatar_url: string; type: string };
  topics: string[];
  visibility: string;
  archived: boolean;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  state_reason?: "completed" | "not_planned" | "reopened" | null;
  html_url: string;
  user: { login: string; id: number; avatar_url: string };
  labels: Array<{ id: number; name: string; color: string }>;
  assignees: Array<{ login: string; id: number }>;
  milestone: { id: number; title: string; number: number; state: string } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  comments: number;
  pull_request?: { url: string; html_url: string };
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  html_url: string;
  diff_url: string;
  head: { ref: string; sha: string; repo: { full_name: string } };
  base: { ref: string; sha: string; repo: { full_name: string } };
  user: { login: string; id: number };
  merged: boolean;
  mergeable: boolean | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
  draft: boolean;
  created_at: string;
  updated_at: string;
  requested_reviewers: Array<{ login: string; id: number }>;
  labels: Array<{ id: number; name: string; color: string }>;
  additions: number;
  deletions: number;
  changed_files: number;
  comments: number;
  review_comments: number;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed" | "waiting";
  conclusion:
    | "success"
    | "failure"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null;
  html_url: string;
  run_number: number;
  event: string;
  head_branch: string;
  head_sha: string;
  created_at: string;
  updated_at: string;
  run_started_at: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  html_url: string;
  created_at: string;
  published_at: string;
  author: { login: string; id: number };
  assets: Array<{
    id: number;
    name: string;
    size: number;
    download_count: number;
    browser_download_url: string;
  }>;
}

export interface GitHubWebhook {
  id: number;
  name: string;
  active: boolean;
  events: string[];
  config: { url: string; content_type: string; secret?: string; insecure_ssl: string };
  created_at: string;
  updated_at: string;
}

export interface GitHubListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  direction?: "asc" | "desc";
  state?: "open" | "closed" | "all";
  since?: string;
}

export class GitHubConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: GitHubConfig;

  constructor(config: GitHubConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.github.com",
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const msg = error.response?.data?.message || error.message;
        if (status === 401) throw new ConnectorError("Invalid GitHub token", error);
        if (status === 403) {
          const rateLimitRemaining = error.response?.headers?.["x-ratelimit-remaining"];
          if (rateLimitRemaining === "0") {
            const resetAt = error.response?.headers?.["x-ratelimit-reset"];
            throw new ConnectorError(
              `GitHub rate limit exceeded. Resets at ${new Date(Number(resetAt) * 1000).toISOString()}`,
              error
            );
          }
          throw new ConnectorError(`GitHub permission denied: ${msg}`, error);
        }
        if (status === 404) throw new ConnectorError(`GitHub resource not found: ${msg}`, error);
        if (status === 422) throw new ConnectorError(`GitHub validation error: ${msg}`, error);
        throw new ConnectorError(`GitHub API error: ${msg}`, error);
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "github",
      name: "GitHub",
      version: "1.0.0",
      apiVersion: "2022-11-28",
      capabilities: { sync: true, webhooks: true },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/user");
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Authenticated User
  // ---------------------------------------------------------------------------
  async getAuthenticatedUser(): Promise<{
    login: string;
    id: number;
    name: string;
    email: string;
    avatar_url: string;
    public_repos: number;
    total_private_repos: number;
  }> {
    try {
      const response = await this.client.get("/user");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get authenticated GitHub user", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Repositories
  // ---------------------------------------------------------------------------
  async listRepos(
    params?: GitHubListParams & { type?: "all" | "owner" | "public" | "private" | "member" }
  ): Promise<GitHubRepo[]> {
    try {
      const response = await this.client.get("/user/repos", {
        params: { per_page: params?.per_page || 30, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list GitHub repos", error);
    }
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get repo ${owner}/${repo}`, error);
    }
  }

  async createRepo(body: {
    name: string;
    description?: string;
    private?: boolean;
    auto_init?: boolean;
    gitignore_template?: string;
    license_template?: string;
  }): Promise<GitHubRepo> {
    try {
      const response = await this.client.post("/user/repos", body);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create GitHub repo", error);
    }
  }

  async listBranches(
    owner: string,
    repo: string,
    params?: { per_page?: number; page?: number; protected?: boolean }
  ): Promise<Array<{ name: string; commit: { sha: string; url: string }; protected: boolean }>> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/branches`, { params });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list branches for ${owner}/${repo}`, error);
    }
  }

  async listCommits(
    owner: string,
    repo: string,
    params?: {
      sha?: string;
      path?: string;
      since?: string;
      until?: string;
      per_page?: number;
      page?: number;
    }
  ): Promise<
    Array<{
      sha: string;
      commit: { message: string; author: { name: string; email: string; date: string } };
      author: { login: string } | null;
      html_url: string;
    }>
  > {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/commits`, {
        params: { per_page: params?.per_page || 30, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list commits for ${owner}/${repo}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Issues
  // ---------------------------------------------------------------------------
  async listIssues(
    owner: string,
    repo: string,
    params?: GitHubListParams & { labels?: string; assignee?: string; milestone?: string | number }
  ): Promise<GitHubIssue[]> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/issues`, {
        params: { per_page: params?.per_page || 30, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list issues for ${owner}/${repo}`, error);
    }
  }

  async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/issues/${issueNumber}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get issue #${issueNumber}`, error);
    }
  }

  async createIssue(
    owner: string,
    repo: string,
    body: {
      title: string;
      body?: string;
      assignees?: string[];
      labels?: string[];
      milestone?: number;
    }
  ): Promise<GitHubIssue> {
    try {
      const response = await this.client.post(`/repos/${owner}/${repo}/issues`, body);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create issue in ${owner}/${repo}`, error);
    }
  }

  async updateIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    updates: {
      title?: string;
      body?: string;
      state?: "open" | "closed";
      state_reason?: "completed" | "not_planned" | "reopened";
      labels?: string[];
      assignees?: string[];
      milestone?: number | null;
    }
  ): Promise<GitHubIssue> {
    try {
      const response = await this.client.patch(
        `/repos/${owner}/${repo}/issues/${issueNumber}`,
        updates
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update issue #${issueNumber}`, error);
    }
  }

  async listIssueComments(
    owner: string,
    repo: string,
    issueNumber: number,
    params?: { per_page?: number; page?: number; since?: string }
  ): Promise<
    Array<{
      id: number;
      body: string;
      user: { login: string };
      created_at: string;
      updated_at: string;
    }>
  > {
    try {
      const response = await this.client.get(
        `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list comments on issue #${issueNumber}`, error);
    }
  }

  async createIssueComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string
  ): Promise<{ id: number; body: string; created_at: string }> {
    try {
      const response = await this.client.post(
        `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
        { body }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create comment on issue #${issueNumber}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Pull Requests
  // ---------------------------------------------------------------------------
  async listPullRequests(
    owner: string,
    repo: string,
    params?: GitHubListParams & { head?: string; base?: string }
  ): Promise<GitHubPullRequest[]> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/pulls`, {
        params: { per_page: params?.per_page || 30, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list PRs for ${owner}/${repo}`, error);
    }
  }

  async getPullRequest(owner: string, repo: string, prNumber: number): Promise<GitHubPullRequest> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/pulls/${prNumber}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get PR #${prNumber}`, error);
    }
  }

  async createPullRequest(
    owner: string,
    repo: string,
    body: { title: string; body?: string; head: string; base: string; draft?: boolean }
  ): Promise<GitHubPullRequest> {
    try {
      const response = await this.client.post(`/repos/${owner}/${repo}/pulls`, body);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create PR in ${owner}/${repo}`, error);
    }
  }

  async updatePullRequest(
    owner: string,
    repo: string,
    prNumber: number,
    updates: { title?: string; body?: string; state?: "open" | "closed"; base?: string }
  ): Promise<GitHubPullRequest> {
    try {
      const response = await this.client.patch(
        `/repos/${owner}/${repo}/pulls/${prNumber}`,
        updates
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update PR #${prNumber}`, error);
    }
  }

  async mergePullRequest(
    owner: string,
    repo: string,
    prNumber: number,
    options?: {
      commit_title?: string;
      commit_message?: string;
      merge_method?: "merge" | "squash" | "rebase";
      sha?: string;
    }
  ): Promise<{ sha: string; merged: boolean; message: string }> {
    try {
      const response = await this.client.put(
        `/repos/${owner}/${repo}/pulls/${prNumber}/merge`,
        options
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to merge PR #${prNumber}`, error);
    }
  }

  async listPRReviews(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<
    Array<{
      id: number;
      user: { login: string };
      body: string;
      state: string;
      submitted_at: string;
    }>
  > {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/pulls/${prNumber}/reviews`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list reviews for PR #${prNumber}`, error);
    }
  }

  async requestReviewers(
    owner: string,
    repo: string,
    prNumber: number,
    reviewers: string[],
    teamReviewers?: string[]
  ): Promise<GitHubPullRequest> {
    try {
      const response = await this.client.post(
        `/repos/${owner}/${repo}/pulls/${prNumber}/requested_reviewers`,
        { reviewers, team_reviewers: teamReviewers }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to request reviewers for PR #${prNumber}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Actions / Workflows
  // ---------------------------------------------------------------------------
  async listWorkflowRuns(
    owner: string,
    repo: string,
    params?: {
      workflow_id?: number | string;
      branch?: string;
      event?: string;
      status?: string;
      per_page?: number;
      page?: number;
    }
  ): Promise<{ total_count: number; workflow_runs: GitHubWorkflowRun[] }> {
    try {
      const path = params?.workflow_id
        ? `/repos/${owner}/${repo}/actions/workflows/${params.workflow_id}/runs`
        : `/repos/${owner}/${repo}/actions/runs`;
      const { workflow_id: _, ...queryParams } = params || {};
      const response = await this.client.get(path, {
        params: { per_page: queryParams?.per_page || 20, ...queryParams },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list workflow runs for ${owner}/${repo}`, error);
    }
  }

  async triggerWorkflow(
    owner: string,
    repo: string,
    workflowId: number | string,
    ref: string,
    inputs?: Record<string, string>
  ): Promise<void> {
    try {
      await this.client.post(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
        ref,
        inputs,
      });
    } catch (error) {
      throw new ConnectorError(`Failed to trigger workflow ${workflowId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Releases
  // ---------------------------------------------------------------------------
  async listReleases(
    owner: string,
    repo: string,
    params?: { per_page?: number; page?: number }
  ): Promise<GitHubRelease[]> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/releases`, { params });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list releases for ${owner}/${repo}`, error);
    }
  }

  async createRelease(
    owner: string,
    repo: string,
    body: {
      tag_name: string;
      name?: string;
      body?: string;
      draft?: boolean;
      prerelease?: boolean;
      target_commitish?: string;
      generate_release_notes?: boolean;
    }
  ): Promise<GitHubRelease> {
    try {
      const response = await this.client.post(`/repos/${owner}/${repo}/releases`, body);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create release in ${owner}/${repo}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Webhooks
  // ---------------------------------------------------------------------------
  async listWebhooks(owner: string, repo: string): Promise<GitHubWebhook[]> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/hooks`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list webhooks for ${owner}/${repo}`, error);
    }
  }

  async createWebhook(
    owner: string,
    repo: string,
    body: {
      config: { url: string; content_type?: string; secret?: string };
      events: string[];
      active?: boolean;
    }
  ): Promise<GitHubWebhook> {
    try {
      const response = await this.client.post(`/repos/${owner}/${repo}/hooks`, {
        name: "web",
        active: body.active !== false,
        events: body.events,
        config: { content_type: "json", ...body.config },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create webhook for ${owner}/${repo}`, error);
    }
  }

  async deleteWebhook(owner: string, repo: string, hookId: number): Promise<void> {
    try {
      await this.client.delete(`/repos/${owner}/${repo}/hooks/${hookId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete webhook ${hookId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------
  async searchCode(
    query: string,
    params?: { per_page?: number; page?: number }
  ): Promise<{
    total_count: number;
    items: Array<{
      name: string;
      path: string;
      sha: string;
      html_url: string;
      repository: { full_name: string };
    }>;
  }> {
    try {
      const response = await this.client.get("/search/code", {
        params: { q: query, per_page: params?.per_page || 30, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to search GitHub code", error);
    }
  }

  async searchIssues(
    query: string,
    params?: {
      per_page?: number;
      page?: number;
      sort?: "comments" | "reactions" | "created" | "updated";
      order?: "asc" | "desc";
    }
  ): Promise<{ total_count: number; items: GitHubIssue[] }> {
    try {
      const response = await this.client.get("/search/issues", { params: { q: query, ...params } });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to search GitHub issues", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Pagination helper
  // ---------------------------------------------------------------------------
  async *paginate<T>(
    endpoint: string,
    params?: Record<string, any>
  ): AsyncGenerator<T[], void, undefined> {
    let page = 1;
    const perPage = params?.per_page || 100;
    while (true) {
      const response = await this.client.get(endpoint, {
        params: { ...params, page, per_page: perPage },
      });
      const data: T[] = response.data;
      if (data.length === 0) break;
      yield data;
      if (data.length < perPage) break;
      page++;
    }
  }
}

export function createGitHubConnector(config: GitHubConfig): GitHubConnector {
  return new GitHubConnector(config);
}
