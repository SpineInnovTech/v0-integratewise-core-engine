import axios, { AxiosInstance } from "axios";
import { BaseConnector, ConnectorConfig, ConnectorError } from "@integratewise/connector-contracts";

// Linear API Configuration
export interface LinearConfig extends ConnectorConfig {
  apiKey: string;
  baseURL?: string;
}

// Linear GraphQL API Response Types
export interface LinearIssue {
  id: string;
  number: number;
  title: string;
  description?: string;
  priority: number; // 0 = None, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low
  estimate?: number; // Story points
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  trashed?: boolean;

  // Relations
  assignee?: {
    id: string;
    displayName: string;
    email: string;
  };

  creator: {
    id: string;
    displayName: string;
    email: string;
  };

  team: {
    id: string;
    name: string;
    key: string;
  };

  project?: {
    id: string;
    name: string;
  };

  state: {
    id: string;
    name: string;
    type: "started" | "unstarted" | "completed" | "canceled";
    color: string;
  };

  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;

  comments: Array<{
    id: string;
    body: string;
    createdAt: string;
    user: {
      id: string;
      displayName: string;
    };
  }>;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  private: boolean;
  issueCount: number;
}

export interface LinearProject {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  canceledAt?: string;
  state: "planned" | "started" | "completed" | "canceled";
  progress: number; // 0-100
}

export interface LinearCycle {
  id: string;
  number: number;
  name?: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  scope: number; // Total issues in cycle
  completedScope: number; // Completed issues
}

export interface LinearUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  admin: boolean;
}

export interface LinearWorkflowState {
  id: string;
  name: string;
  type: "started" | "unstarted" | "completed" | "canceled";
  color: string;
  position: number;
}

export class LinearConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: LinearConfig;

  constructor(config: LinearConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseURL || "https://api.linear.app/graphql",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Authorization: config.apiKey,
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new ConnectorError("Invalid Linear API key", error);
        }
        if (error.response?.status === 429) {
          throw new ConnectorError("Linear API rate limit exceeded", error);
        }
        if (error.response?.data?.errors) {
          throw new ConnectorError(
            `Linear API error: ${error.response.data.errors[0].message}`,
            error
          );
        }
        throw new ConnectorError("Linear API error", error);
      }
    );
  }

  async testConnection(): Promise<boolean> {
    try {
      const query = `
        query {
          viewer {
            id
            displayName
          }
        }
      `;
      const response = await this.client.post("", { query });
      return response.status === 200 && response.data.data.viewer;
    } catch (error) {
      throw new ConnectorError("Failed to test Linear connection", error);
    }
  }

  private async executeQuery<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await this.client.post("", { query, variables });
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    return response.data.data;
  }

  async getTeams(): Promise<LinearTeam[]> {
    try {
      const query = `
        query {
          teams {
            nodes {
              id
              name
              key
              description
              createdAt
              updatedAt
              private
              issueCount
            }
          }
        }
      `;
      const data = await this.executeQuery<{ teams: { nodes: LinearTeam[] } }>(query);
      return data.teams.nodes;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Linear teams", error);
    }
  }

  async getIssues(params?: {
    teamId?: string;
    assigneeId?: string;
    stateId?: string;
    projectId?: string;
    first?: number;
    after?: string;
  }): Promise<{ issues: LinearIssue[]; pageInfo: { hasNextPage: boolean; endCursor?: string } }> {
    try {
      const filters: string[] = [];

      if (params?.teamId) {
        filters.push(`team: { id: { eq: "${params.teamId}" } }`);
      }

      if (params?.assigneeId) {
        filters.push(`assignee: { id: { eq: "${params.assigneeId}" } }`);
      }

      if (params?.stateId) {
        filters.push(`state: { id: { eq: "${params.stateId}" } }`);
      }

      if (params?.projectId) {
        filters.push(`project: { id: { eq: "${params.projectId}" } }`);
      }

      const filterString = filters.length > 0 ? `filter: { ${filters.join(", ")} }` : "";

      const query = `
        query GetIssues($first: Int, $after: String) {
          issues(${filterString}, first: $first, after: $after, orderBy: updatedAt) {
            nodes {
              id
              number
              title
              description
              priority
              estimate
              startedAt
              completedAt
              createdAt
              updatedAt
              dueDate
              trashed
              assignee {
                id
                displayName
                email
              }
              creator {
                id
                displayName
                email
              }
              team {
                id
                name
                key
              }
              project {
                id
                name
              }
              state {
                id
                name
                type
                color
              }
              labels {
                id
                name
                color
              }
              comments {
                id
                body
                createdAt
                user {
                  id
                  displayName
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const data = await this.executeQuery<{
        issues: { nodes: LinearIssue[]; pageInfo: { hasNextPage: boolean; endCursor?: string } };
      }>(query, { first: params?.first || 50, after: params?.after });

      return {
        issues: data.issues.nodes,
        pageInfo: data.issues.pageInfo,
      };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Linear issues", error);
    }
  }

  async getIssue(issueId: string): Promise<LinearIssue> {
    try {
      const query = `
        query GetIssue($id: String!) {
          issue(id: $id) {
            id
            number
            title
            description
            priority
            estimate
            startedAt
            completedAt
            createdAt
            updatedAt
            dueDate
            trashed
            assignee {
              id
              displayName
              email
            }
            creator {
              id
              displayName
              email
            }
            team {
              id
              name
              key
            }
            project {
              id
              name
            }
            state {
              id
              name
              type
              color
            }
            labels {
              id
              name
              color
            }
            comments {
              id
              body
              createdAt
              user {
                id
                displayName
              }
            }
          }
        }
      `;

      const data = await this.executeQuery<{ issue: LinearIssue }>(query, { id: issueId });
      return data.issue;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Linear issue ${issueId}`, error);
    }
  }

  async createIssue(issueData: {
    teamId: string;
    title: string;
    description?: string;
    priority?: number;
    estimate?: number;
    assigneeId?: string;
    projectId?: string;
    stateId?: string;
    labelIds?: string[];
    dueDate?: string;
  }): Promise<LinearIssue> {
    try {
      const mutation = `
        mutation CreateIssue($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue {
              id
              number
              title
              description
              priority
              estimate
              createdAt
              updatedAt
              assignee {
                id
                displayName
                email
              }
              team {
                id
                name
                key
              }
              project {
                id
                name
              }
              state {
                id
                name
                type
                color
              }
              labels {
                id
                name
                color
              }
            }
          }
        }
      `;

      const input: any = {
        teamId: issueData.teamId,
        title: issueData.title,
      };

      if (issueData.description) input.description = issueData.description;
      if (issueData.priority !== undefined) input.priority = issueData.priority;
      if (issueData.estimate !== undefined) input.estimate = issueData.estimate;
      if (issueData.assigneeId) input.assigneeId = issueData.assigneeId;
      if (issueData.projectId) input.projectId = issueData.projectId;
      if (issueData.stateId) input.stateId = issueData.stateId;
      if (issueData.labelIds) input.labelIds = issueData.labelIds;
      if (issueData.dueDate) input.dueDate = issueData.dueDate;

      const data = await this.executeQuery<{
        issueCreate: { success: boolean; issue: LinearIssue };
      }>(mutation, { input });

      if (!data.issueCreate.success) {
        throw new Error("Failed to create issue");
      }

      return data.issueCreate.issue;
    } catch (error) {
      throw new ConnectorError("Failed to create Linear issue", error);
    }
  }

  async updateIssue(
    issueId: string,
    updateData: {
      title?: string;
      description?: string;
      priority?: number;
      estimate?: number;
      assigneeId?: string;
      projectId?: string;
      stateId?: string;
      labelIds?: string[];
      dueDate?: string;
    }
  ): Promise<LinearIssue> {
    try {
      const mutation = `
        mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
          issueUpdate(id: $id, input: $input) {
            success
            issue {
              id
              number
              title
              description
              priority
              estimate
              updatedAt
              assignee {
                id
                displayName
                email
              }
              project {
                id
                name
              }
              state {
                id
                name
                type
                color
              }
              labels {
                id
                name
                color
              }
            }
          }
        }
      `;

      const input: any = {};
      if (updateData.title) input.title = updateData.title;
      if (updateData.description !== undefined) input.description = updateData.description;
      if (updateData.priority !== undefined) input.priority = updateData.priority;
      if (updateData.estimate !== undefined) input.estimate = updateData.estimate;
      if (updateData.assigneeId !== undefined) input.assigneeId = updateData.assigneeId;
      if (updateData.projectId !== undefined) input.projectId = updateData.projectId;
      if (updateData.stateId) input.stateId = updateData.stateId;
      if (updateData.labelIds !== undefined) input.labelIds = updateData.labelIds;
      if (updateData.dueDate !== undefined) input.dueDate = updateData.dueDate;

      const data = await this.executeQuery<{
        issueUpdate: { success: boolean; issue: LinearIssue };
      }>(mutation, { id: issueId, input });

      if (!data.issueUpdate.success) {
        throw new Error("Failed to update issue");
      }

      return data.issueUpdate.issue;
    } catch (error) {
      throw new ConnectorError(`Failed to update Linear issue ${issueId}`, error);
    }
  }

  async getProjects(teamId?: string): Promise<LinearProject[]> {
    try {
      const filter = teamId ? `filter: { team: { id: { eq: "${teamId}" } } }` : "";

      const query = `
        query {
          projects(${filter}) {
            nodes {
              id
              name
              description
              color
              createdAt
              updatedAt
              startedAt
              completedAt
              canceledAt
              state
              progress
            }
          }
        }
      `;

      const data = await this.executeQuery<{ projects: { nodes: LinearProject[] } }>(query);
      return data.projects.nodes;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Linear projects", error);
    }
  }

  async getCycles(teamId: string): Promise<LinearCycle[]> {
    try {
      const query = `
        query GetCycles($teamId: String!) {
          cycles(filter: { team: { id: { eq: $teamId } } }) {
            nodes {
              id
              number
              name
              description
              startsAt
              endsAt
              completedAt
              createdAt
              updatedAt
              progress
              scope
              completedScope
            }
          }
        }
      `;

      const data = await this.executeQuery<{ cycles: { nodes: LinearCycle[] } }>(query, { teamId });
      return data.cycles.nodes;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Linear cycles", error);
    }
  }

  async getUsers(): Promise<LinearUser[]> {
    try {
      const query = `
        query {
          users {
            nodes {
              id
              displayName
              email
              avatarUrl
              createdAt
              updatedAt
              active
              admin
            }
          }
        }
      `;

      const data = await this.executeQuery<{ users: { nodes: LinearUser[] } }>(query);
      return data.users.nodes;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Linear users", error);
    }
  }

  async getWorkflowStates(teamId: string): Promise<LinearWorkflowState[]> {
    try {
      const query = `
        query GetWorkflowStates($teamId: String!) {
          workflowStates(filter: { team: { id: { eq: $teamId } } }) {
            nodes {
              id
              name
              type
              color
              position
            }
          }
        }
      `;

      const data = await this.executeQuery<{ workflowStates: { nodes: LinearWorkflowState[] } }>(
        query,
        { teamId }
      );
      return data.workflowStates.nodes;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Linear workflow states", error);
    }
  }

  // Analytics methods
  async getTeamMetrics(teamId: string): Promise<{
    totalIssues: number;
    completedIssues: number;
    inProgressIssues: number;
    backlogIssues: number;
    avgCycleTime: number; // days
    avgLeadTime: number; // days
    throughput: number; // issues per week
    burndownData: Array<{ date: string; remaining: number }>;
  }> {
    try {
      const { issues } = await this.getIssues({ teamId, first: 1000 });

      const metrics = {
        totalIssues: issues.length,
        completedIssues: 0,
        inProgressIssues: 0,
        backlogIssues: 0,
        avgCycleTime: 0,
        avgLeadTime: 0,
        throughput: 0,
        burndownData: [] as Array<{ date: string; remaining: number }>,
      };

      let totalCycleTime = 0;
      let totalLeadTime = 0;
      let completedCount = 0;
      let startedCount = 0;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      for (const issue of issues) {
        if (issue.state.type === "completed") {
          metrics.completedIssues++;

          // Calculate cycle time (started to completed)
          if (issue.startedAt && issue.completedAt) {
            const started = new Date(issue.startedAt).getTime();
            const completed = new Date(issue.completedAt).getTime();
            totalCycleTime += completed - started;
            completedCount++;
          }

          // Calculate lead time (created to completed)
          if (issue.createdAt && issue.completedAt) {
            const created = new Date(issue.createdAt).getTime();
            const completed = new Date(issue.completedAt).getTime();
            totalLeadTime += completed - created;
            startedCount++;
          }

          // Count throughput
          if (issue.completedAt && new Date(issue.completedAt) >= weekAgo) {
            metrics.throughput++;
          }
        } else if (issue.state.type === "started") {
          metrics.inProgressIssues++;
        } else if (issue.state.type === "unstarted") {
          metrics.backlogIssues++;
        }
      }

      if (completedCount > 0) {
        metrics.avgCycleTime = totalCycleTime / completedCount / (1000 * 60 * 60 * 24); // days
      }

      if (startedCount > 0) {
        metrics.avgLeadTime = totalLeadTime / startedCount / (1000 * 60 * 60 * 24); // days
      }

      return metrics;
    } catch (error) {
      throw new ConnectorError("Failed to calculate team metrics", error);
    }
  }
}

// Factory function for creating Linear connector
export function createLinearConnector(config: LinearConfig): LinearConnector {
  return new LinearConnector(config);
}
