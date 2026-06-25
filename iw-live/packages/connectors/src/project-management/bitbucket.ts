import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Bitbucket Connector — Bitbucket Cloud REST API 2.0
// Real connection → Creamy load → Delayed full load → Delta load
// ============================================================================

export interface BitbucketConfig extends ConnectorConfig {
  username: string; // Bitbucket username (for app passwords) or use OAuth2 token
  appPassword: string; // Bitbucket App Password
  workspace?: string; // Default workspace slug
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Response Types
// ---------------------------------------------------------------------------
export interface BitbucketRepository {
  uuid: string;
  name: string;
  full_name: string;
  slug: string;
  description?: string;
  language: string;
  is_private: boolean;
  created_on: string;
  updated_on: string;
  size: number;
  mainbranch?: { name: string; type: string };
  owner: { display_name: string; uuid: string; type: string };
  project?: { key: string; name: string; uuid: string };
  links: { html: { href: string }; clone: Array<{ name: string; href: string }> };
  has_issues: boolean;
  has_wiki: boolean;
  fork_policy: string;
}

export interface BitbucketPullRequest {
  id: number;
  title: string;
  description?: string;
  state: "OPEN" | "MERGED" | "DECLINED" | "SUPERSEDED";
  created_on: string;
  updated_on: string;
  merge_commit?: { hash: string };
  closed_by?: { display_name: string; uuid: string };
  author: { display_name: string; uuid: string; links: { avatar: { href: string } } };
  source: { branch: { name: string }; repository: { full_name: string } };
  destination: { branch: { name: string }; repository: { full_name: string } };
  reviewers: Array<{ display_name: string; uuid: string }>;
  participants: Array<{ user: { display_name: string }; role: string; approved: boolean }>;
  comment_count: number;
  task_count: number;
  links: { html: { href: string }; diff: { href: string } };
}

export interface BitbucketIssue {
  id: number;
  title: string;
  content?: { raw?: string; markup: string; html?: string };
  state: "new" | "open" | "resolved" | "on hold" | "invalid" | "duplicate" | "wontfix" | "closed";
  priority: "trivial" | "minor" | "major" | "critical" | "blocker";
  kind: "bug" | "enhancement" | "proposal" | "task";
  created_on: string;
  updated_on: string;
  reporter: { display_name: string; uuid: string };
  assignee?: { display_name: string; uuid: string };
  component?: { name: string };
  milestone?: { name: string };
  votes: number;
  links: { html: { href: string } };
}

export interface BitbucketCommit {
  hash: string;
  message: string;
  date: string;
  author: { raw: string; user?: { display_name: string; uuid: string } };
  parents: Array<{ hash: string }>;
  links: { html: { href: string } };
}

export interface BitbucketBranch {
  name: string;
  target: {
    hash: string;
    date: string;
    message: string;
    author: { raw: string };
  };
  type: string;
  links: { html: { href: string } };
}

export interface BitbucketPipeline {
  uuid: string;
  build_number: number;
  state: {
    name: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "HALTED" | "PAUSED";
    result?: { name: "SUCCESSFUL" | "FAILED" | "ERROR" | "STOPPED" | "EXPIRED" };
  };
  target: { ref_name: string; type: string };
  trigger: { name: string; type: string };
  creator: { display_name: string; uuid: string };
  created_on: string;
  completed_on?: string;
  duration_in_seconds?: number;
  links: { html: { href: string } };
}

export interface BitbucketWorkspace {
  uuid: string;
  name: string;
  slug: string;
  is_private: boolean;
  created_on: string;
  updated_on?: string;
  links: { html: { href: string }; avatar: { href: string } };
}

export interface BitbucketUser {
  display_name: string;
  uuid: string;
  nickname: string;
  account_id: string;
  links: { html: { href: string }; avatar: { href: string } };
  created_on: string;
}

export interface BitbucketPaginatedResponse<T> {
  size?: number;
  page?: number;
  pagelen: number;
  next?: string;
  previous?: string;
  values: T[];
}

export class BitbucketConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: BitbucketConfig;

  constructor(config: BitbucketConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.bitbucket.org/2.0",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: config.username,
        password: config.appPassword,
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const msg =
          error.response?.data?.error?.message || error.response?.data?.error || error.message;
        if (status === 401) throw new ConnectorError("Invalid Bitbucket credentials", error);
        if (status === 403) throw new ConnectorError(`Bitbucket permission denied: ${msg}`, error);
        if (status === 404) throw new ConnectorError(`Bitbucket resource not found: ${msg}`, error);
        if (status === 429) throw new ConnectorError("Bitbucket rate limit exceeded", error);
        throw new ConnectorError(`Bitbucket API error: ${msg}`, error);
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "bitbucket",
      name: "Bitbucket",
      version: "1.0.0",
      apiVersion: "2.0",
      capabilities: { sync: true, webhooks: true },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/user");
      return response.status === 200 && !!response.data.uuid;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Authenticated User
  // ---------------------------------------------------------------------------
  async getAuthenticatedUser(): Promise<BitbucketUser> {
    try {
      const response = await this.client.get("/user");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get authenticated Bitbucket user", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Workspaces
  // ---------------------------------------------------------------------------
  async getWorkspaces(params?: {
    pagelen?: number;
    page?: number;
  }): Promise<BitbucketPaginatedResponse<BitbucketWorkspace>> {
    try {
      const response = await this.client.get("/workspaces", {
        params: { pagelen: params?.pagelen || 25, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Bitbucket workspaces", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Repositories
  // ---------------------------------------------------------------------------
  async listRepositories(
    workspace?: string,
    params?: { pagelen?: number; page?: number; sort?: string; q?: string }
  ): Promise<BitbucketPaginatedResponse<BitbucketRepository>> {
    try {
      const ws = workspace || this.config.workspace;
      if (!ws) throw new ConnectorError("Workspace slug is required");
      const response = await this.client.get(`/repositories/${ws}`, {
        params: { pagelen: params?.pagelen || 25, ...params },
      });
      return response.data;
    } catch (error) {
      if (error instanceof ConnectorError) throw error;
      throw new ConnectorError("Failed to list Bitbucket repositories", error);
    }
  }

  async getRepository(workspace: string, repoSlug: string): Promise<BitbucketRepository> {
    try {
      const response = await this.client.get(`/repositories/${workspace}/${repoSlug}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get repository ${workspace}/${repoSlug}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Pull Requests
  // ---------------------------------------------------------------------------
  async listPullRequests(
    workspace: string,
    repoSlug: string,
    params?: { state?: string; pagelen?: number; page?: number }
  ): Promise<BitbucketPaginatedResponse<BitbucketPullRequest>> {
    try {
      const response = await this.client.get(
        `/repositories/${workspace}/${repoSlug}/pullrequests`,
        { params: { state: params?.state || "OPEN", pagelen: params?.pagelen || 25, ...params } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list PRs for ${workspace}/${repoSlug}`, error);
    }
  }

  async getPullRequest(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<BitbucketPullRequest> {
    try {
      const response = await this.client.get(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}`
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get PR #${prId}`, error);
    }
  }

  async createPullRequest(
    workspace: string,
    repoSlug: string,
    data: {
      title: string;
      description?: string;
      source: { branch: { name: string } };
      destination: { branch: { name: string } };
      reviewers?: Array<{ uuid: string }>;
      close_source_branch?: boolean;
    }
  ): Promise<BitbucketPullRequest> {
    try {
      const response = await this.client.post(
        `/repositories/${workspace}/${repoSlug}/pullrequests`,
        data
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Bitbucket pull request", error);
    }
  }

  async approvePullRequest(workspace: string, repoSlug: string, prId: number): Promise<void> {
    try {
      await this.client.post(`/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/approve`);
    } catch (error) {
      throw new ConnectorError(`Failed to approve PR #${prId}`, error);
    }
  }

  async mergePullRequest(
    workspace: string,
    repoSlug: string,
    prId: number,
    options?: {
      merge_strategy?: "merge_commit" | "squash" | "fast_forward";
      close_source_branch?: boolean;
      message?: string;
    }
  ): Promise<BitbucketPullRequest> {
    try {
      const response = await this.client.post(
        `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/merge`,
        options
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to merge PR #${prId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Issues
  // ---------------------------------------------------------------------------
  async listIssues(
    workspace: string,
    repoSlug: string,
    params?: { pagelen?: number; page?: number; q?: string; sort?: string }
  ): Promise<BitbucketPaginatedResponse<BitbucketIssue>> {
    try {
      const response = await this.client.get(`/repositories/${workspace}/${repoSlug}/issues`, {
        params: { pagelen: params?.pagelen || 25, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list issues for ${workspace}/${repoSlug}`, error);
    }
  }

  async createIssue(
    workspace: string,
    repoSlug: string,
    data: {
      title: string;
      content?: { raw: string };
      priority?: string;
      kind?: string;
      assignee?: { uuid: string };
    }
  ): Promise<BitbucketIssue> {
    try {
      const response = await this.client.post(
        `/repositories/${workspace}/${repoSlug}/issues`,
        data
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Bitbucket issue", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Commits
  // ---------------------------------------------------------------------------
  async listCommits(
    workspace: string,
    repoSlug: string,
    params?: { pagelen?: number; page?: number; include?: string; exclude?: string }
  ): Promise<BitbucketPaginatedResponse<BitbucketCommit>> {
    try {
      const response = await this.client.get(`/repositories/${workspace}/${repoSlug}/commits`, {
        params: { pagelen: params?.pagelen || 30, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list commits for ${workspace}/${repoSlug}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Branches
  // ---------------------------------------------------------------------------
  async listBranches(
    workspace: string,
    repoSlug: string,
    params?: { pagelen?: number; page?: number; sort?: string; q?: string }
  ): Promise<BitbucketPaginatedResponse<BitbucketBranch>> {
    try {
      const response = await this.client.get(
        `/repositories/${workspace}/${repoSlug}/refs/branches`,
        { params: { pagelen: params?.pagelen || 25, ...params } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list branches for ${workspace}/${repoSlug}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Pipelines
  // ---------------------------------------------------------------------------
  async listPipelines(
    workspace: string,
    repoSlug: string,
    params?: { pagelen?: number; page?: number; sort?: string }
  ): Promise<BitbucketPaginatedResponse<BitbucketPipeline>> {
    try {
      const response = await this.client.get(`/repositories/${workspace}/${repoSlug}/pipelines`, {
        params: { pagelen: params?.pagelen || 25, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list pipelines for ${workspace}/${repoSlug}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Webhooks
  // ---------------------------------------------------------------------------
  async listWebhooks(
    workspace: string,
    repoSlug: string
  ): Promise<
    BitbucketPaginatedResponse<{
      uuid: string;
      url: string;
      description: string;
      active: boolean;
      events: string[];
    }>
  > {
    try {
      const response = await this.client.get(`/repositories/${workspace}/${repoSlug}/hooks`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list webhooks for ${workspace}/${repoSlug}`, error);
    }
  }

  async createWebhook(
    workspace: string,
    repoSlug: string,
    data: {
      description: string;
      url: string;
      active: boolean;
      events: string[];
      secret?: string;
    }
  ): Promise<any> {
    try {
      const response = await this.client.post(`/repositories/${workspace}/${repoSlug}/hooks`, data);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create webhook for ${workspace}/${repoSlug}`, error);
    }
  }

  async deleteWebhook(workspace: string, repoSlug: string, webhookUuid: string): Promise<void> {
    try {
      await this.client.delete(`/repositories/${workspace}/${repoSlug}/hooks/${webhookUuid}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete webhook ${webhookUuid}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Workspace Members
  // ---------------------------------------------------------------------------
  async listWorkspaceMembers(
    workspace?: string,
    params?: { pagelen?: number; page?: number }
  ): Promise<BitbucketPaginatedResponse<{ user: BitbucketUser; workspace: { slug: string } }>> {
    try {
      const ws = workspace || this.config.workspace;
      if (!ws) throw new ConnectorError("Workspace slug is required");
      const response = await this.client.get(`/workspaces/${ws}/members`, {
        params: { pagelen: params?.pagelen || 100, ...params },
      });
      return response.data;
    } catch (error) {
      if (error instanceof ConnectorError) throw error;
      throw new ConnectorError("Failed to list workspace members", error);
    }
  }
}

export function createBitbucketConnector(config: BitbucketConfig): BitbucketConnector {
  return new BitbucketConnector(config);
}
