import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// GitLab Connector — GitLab REST API v4
// Real connection → Creamy load → Delayed full load → Delta load
// ============================================================================

export interface GitLabConfig extends ConnectorConfig {
  personalAccessToken: string;
  baseUrl?: string; // defaults to https://gitlab.com for SaaS
}

// ---------------------------------------------------------------------------
// Response Types
// ---------------------------------------------------------------------------
export interface GitLabProject {
  id: number;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  description?: string;
  web_url: string;
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  default_branch: string;
  created_at: string;
  last_activity_at: string;
  star_count: number;
  forks_count: number;
  open_issues_count: number;
  visibility: "private" | "internal" | "public";
  archived: boolean;
  namespace: { id: number; name: string; kind: string; full_path: string };
  topics?: string[];
}

export interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  description?: string;
  state: "opened" | "closed";
  created_at: string;
  updated_at: string;
  closed_at?: string;
  web_url: string;
  author: { id: number; username: string; name: string; avatar_url?: string };
  assignees: Array<{ id: number; username: string; name: string }>;
  labels: string[];
  milestone?: { id: number; title: string; due_date?: string; state: string };
  due_date?: string;
  weight?: number;
  confidential: boolean;
  user_notes_count: number;
  upvotes: number;
  downvotes: number;
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description?: string;
  state: "opened" | "closed" | "merged" | "locked";
  source_branch: string;
  target_branch: string;
  created_at: string;
  updated_at: string;
  merged_at?: string;
  closed_at?: string;
  web_url: string;
  diff_url?: string;
  author: { id: number; username: string; name: string };
  assignees: Array<{ id: number; username: string; name: string }>;
  reviewers: Array<{ id: number; username: string; name: string }>;
  labels: string[];
  milestone?: { id: number; title: string };
  merge_status: string;
  draft: boolean;
  changes_count?: string;
  user_notes_count: number;
  source_project_id: number;
  target_project_id: number;
  has_conflicts: boolean;
}

export interface GitLabPipeline {
  id: number;
  iid: number;
  status:
    | "created"
    | "waiting_for_resource"
    | "preparing"
    | "pending"
    | "running"
    | "success"
    | "failed"
    | "canceled"
    | "skipped"
    | "manual"
    | "scheduled";
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  finished_at?: string;
  source: string;
  user: { id: number; username: string; name: string };
  duration?: number;
}

export interface GitLabBranch {
  name: string;
  merged: boolean;
  protected: boolean;
  default: boolean;
  developers_can_push: boolean;
  developers_can_merge: boolean;
  can_push: boolean;
  web_url: string;
  commit: {
    id: string;
    short_id: string;
    title: string;
    message: string;
    author_name: string;
    author_email: string;
    authored_date: string;
    committed_date: string;
  };
}

export interface GitLabMember {
  id: number;
  username: string;
  name: string;
  state: "active" | "blocked";
  avatar_url?: string;
  web_url: string;
  access_level: number;
  created_at: string;
  expires_at?: string;
}

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committed_date: string;
  web_url: string;
  parent_ids: string[];
  stats?: { additions: number; deletions: number; total: number };
}

export interface GitLabRelease {
  tag_name: string;
  name: string;
  description?: string;
  created_at: string;
  released_at: string;
  author: { id: number; username: string; name: string };
  assets: {
    count: number;
    sources: Array<{ format: string; url: string }>;
    links: Array<{ id: number; name: string; url: string; direct_asset_url: string }>;
  };
}

export interface GitLabListParams {
  page?: number;
  per_page?: number;
  order_by?: string;
  sort?: "asc" | "desc";
  state?: string;
  updated_after?: string;
  updated_before?: string;
}

export class GitLabConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: GitLabConfig;

  constructor(config: GitLabConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: `${config.baseUrl || "https://gitlab.com"}/api/v4`,
      timeout: 30000,
      headers: {
        "PRIVATE-TOKEN": config.personalAccessToken,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const msg = error.response?.data?.message || error.response?.data?.error || error.message;
        if (status === 401) throw new ConnectorError("Invalid GitLab personal access token", error);
        if (status === 403) throw new ConnectorError(`GitLab permission denied: ${msg}`, error);
        if (status === 404) throw new ConnectorError(`GitLab resource not found: ${msg}`, error);
        if (status === 429) {
          const retryAfter = error.response?.headers?.["retry-after"];
          throw new ConnectorError(`GitLab rate limit exceeded. Retry after ${retryAfter}s`, error);
        }
        throw new ConnectorError(`GitLab API error: ${msg}`, error);
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "gitlab",
      name: "GitLab",
      version: "1.0.0",
      apiVersion: "v4",
      capabilities: { sync: true, webhooks: true },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/user");
      return response.status === 200 && !!response.data.id;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Authenticated User
  // ---------------------------------------------------------------------------
  async getAuthenticatedUser(): Promise<{
    id: number;
    username: string;
    name: string;
    email: string;
    state: string;
    avatar_url: string;
    web_url: string;
    is_admin: boolean;
    created_at: string;
  }> {
    try {
      const response = await this.client.get("/user");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get authenticated GitLab user", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------------
  async listProjects(
    params?: GitLabListParams & {
      membership?: boolean;
      owned?: boolean;
      visibility?: string;
      search?: string;
      with_issues_enabled?: boolean;
      with_merge_requests_enabled?: boolean;
    }
  ): Promise<GitLabProject[]> {
    try {
      const response = await this.client.get("/projects", {
        params: { membership: true, per_page: params?.per_page || 20, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list GitLab projects", error);
    }
  }

  async getProject(projectId: number | string): Promise<GitLabProject> {
    try {
      const response = await this.client.get(`/projects/${encodeURIComponent(String(projectId))}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get GitLab project ${projectId}`, error);
    }
  }

  async getProjectMembers(
    projectId: number | string,
    params?: GitLabListParams
  ): Promise<GitLabMember[]> {
    try {
      const response = await this.client.get(
        `/projects/${encodeURIComponent(String(projectId))}/members`,
        { params: { per_page: params?.per_page || 100, ...params } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get members for project ${projectId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Issues
  // ---------------------------------------------------------------------------
  async listProjectIssues(
    projectId: number | string,
    params?: GitLabListParams & { labels?: string; assignee_username?: string; milestone?: string }
  ): Promise<GitLabIssue[]> {
    try {
      const response = await this.client.get(
        `/projects/${encodeURIComponent(String(projectId))}/issues`,
        { params: { per_page: params?.per_page || 20, ...params } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list issues for project ${projectId}`, error);
    }
  }

  async getIssue(projectId: number | string, issueIid: number): Promise<GitLabIssue> {
    try {
      const response = await this.client.get(
        `/projects/${encodeURIComponent(String(projectId))}/issues/${issueIid}`
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get issue !${issueIid}`, error);
    }
  }

  async createIssue(
    projectId: number | string,
    data: {
      title: string;
      description?: string;
      assignee_ids?: number[];
      labels?: string;
      milestone_id?: number;
      due_date?: string;
      weight?: number;
      confidential?: boolean;
    }
  ): Promise<GitLabIssue> {
    try {
      const response = await this.client.post(
        `/projects/${encodeURIComponent(String(projectId))}/issues`,
        data
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create GitLab issue", error);
    }
  }

  async updateIssue(
    projectId: number | string,
    issueIid: number,
    data: Partial<{
      title: string;
      description: string;
      assignee_ids: number[];
      labels: string;
      milestone_id: number;
      state_event: "close" | "reopen";
      due_date: string;
      weight: number;
    }>
  ): Promise<GitLabIssue> {
    try {
      const response = await this.client.put(
        `/projects/${encodeURIComponent(String(projectId))}/issues/${issueIid}`,
        data
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update issue !${issueIid}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Merge Requests
  // ---------------------------------------------------------------------------
  async listProjectMergeRequests(
    projectId: number | string,
    params?: GitLabListParams & { scope?: string; labels?: string }
  ): Promise<GitLabMergeRequest[]> {
    try {
      const response = await this.client.get(
        `/projects/${encodeURIComponent(String(projectId))}/merge_requests`,
        { params: { per_page: params?.per_page || 20, ...params } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list merge requests for project ${projectId}`, error);
    }
  }

  async getMergeRequest(projectId: number | string, mrIid: number): Promise<GitLabMergeRequest> {
    try {
      const response = await this.client.get(
        `/projects/${encodeURIComponent(String(projectId))}/merge_requests/${mrIid}`
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get merge request !${mrIid}`, error);
    }
  }

  async createMergeRequest(
    projectId: number | string,
    data: {
      source_branch: string;
      target_branch: string;
      title: string;
      description?: string;
      assignee_id?: number;
      reviewer_ids?: number[];
      labels?: string;
      milestone_id?: number;
    }
  ): Promise<GitLabMergeRequest> {
    try {
      const response = await this.client.post(
        `/projects/${encodeURIComponent(String(projectId))}/merge_requests`,
        data
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create GitLab merge request", error);
    }
  }

  async acceptMergeRequest(
    projectId: number | string,
    mrIid: number,
    options?: {
      merge_commit_message?: string;
      squash_commit_message?: string;
      squash?: boolean;
      should_remove_source_branch?: boolean;
    }
  ): Promise<GitLabMergeRequest> {
    try {
      const response = await this.client.put(
        `/projects/${encodeURIComponent(String(projectId))}/merge_requests/${mrIid}/merge`,
        options
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to merge MR !${mrIid}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Branches
  // ---------------------------------------------------------------------------
  async listBranches(
    projectId: number | string,
    params?: { search?: string; per_page?: number; page?: number }
  ): Promise<GitLabBranch[]> {
    try {
      const response = await this.client.get(
        `/projects/${encodeURIComponent(String(projectId))}/repository/branches`,
        { params: { per_page: params?.per_page || 20, ...params } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list branches for project ${projectId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Commits
  // ---------------------------------------------------------------------------
  async listCommits(
    projectId: number | string,
    params?: {
      ref_name?: string;
      since?: string;
      until?: string;
      per_page?: number;
      page?: number;
    }
  ): Promise<GitLabCommit[]> {
    try {
      const response = await this.client.get(
        `/projects/${encodeURIComponent(String(projectId))}/repository/commits`,
        { params: { per_page: params?.per_page || 20, ...params } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list commits for project ${projectId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Pipelines
  // ---------------------------------------------------------------------------
  async listPipelines(
    projectId: number | string,
    params?: GitLabListParams & { ref?: string; status?: string; scope?: string }
  ): Promise<GitLabPipeline[]> {
    try {
      const response = await this.client.get(
        `/projects/${encodeURIComponent(String(projectId))}/pipelines`,
        { params: { per_page: params?.per_page || 20, ...params } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list pipelines for project ${projectId}`, error);
    }
  }

  async getPipeline(projectId: number | string, pipelineId: number): Promise<GitLabPipeline> {
    try {
      const response = await this.client.get(
        `/projects/${encodeURIComponent(String(projectId))}/pipelines/${pipelineId}`
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get pipeline ${pipelineId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Releases
  // ---------------------------------------------------------------------------
  async listReleases(
    projectId: number | string,
    params?: { per_page?: number; page?: number }
  ): Promise<GitLabRelease[]> {
    try {
      const response = await this.client.get(
        `/projects/${encodeURIComponent(String(projectId))}/releases`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list releases for project ${projectId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Groups
  // ---------------------------------------------------------------------------
  async listGroups(params?: { per_page?: number; page?: number; search?: string }): Promise<
    Array<{
      id: number;
      name: string;
      path: string;
      full_name: string;
      full_path: string;
      visibility: string;
      web_url: string;
      description?: string;
    }>
  > {
    try {
      const response = await this.client.get("/groups", {
        params: { per_page: params?.per_page || 20, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list GitLab groups", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Webhooks
  // ---------------------------------------------------------------------------
  async listProjectHooks(projectId: number | string): Promise<
    Array<{
      id: number;
      url: string;
      push_events: boolean;
      issues_events: boolean;
      merge_requests_events: boolean;
      created_at: string;
    }>
  > {
    try {
      const response = await this.client.get(
        `/projects/${encodeURIComponent(String(projectId))}/hooks`
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list hooks for project ${projectId}`, error);
    }
  }

  async createProjectHook(
    projectId: number | string,
    data: {
      url: string;
      push_events?: boolean;
      issues_events?: boolean;
      merge_requests_events?: boolean;
      pipeline_events?: boolean;
      tag_push_events?: boolean;
      token?: string;
      enable_ssl_verification?: boolean;
    }
  ): Promise<any> {
    try {
      const response = await this.client.post(
        `/projects/${encodeURIComponent(String(projectId))}/hooks`,
        data
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create hook for project ${projectId}`, error);
    }
  }

  async deleteProjectHook(projectId: number | string, hookId: number): Promise<void> {
    try {
      await this.client.delete(
        `/projects/${encodeURIComponent(String(projectId))}/hooks/${hookId}`
      );
    } catch (error) {
      throw new ConnectorError(`Failed to delete hook ${hookId}`, error);
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

export function createGitLabConnector(config: GitLabConfig): GitLabConnector {
  return new GitLabConnector(config);
}
