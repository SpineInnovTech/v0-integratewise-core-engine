import axios, { AxiosInstance } from "axios";
import { BaseConnector, ConnectorConfig, ConnectorError } from "@integratewise/connector-contracts";

// Jira API Configuration
export interface JiraConfig extends ConnectorConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey?: string; // Optional default project
}

// Jira API Response Types
export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    issuetype: {
      name: string;
      id: string;
    };
    status: {
      name: string;
      id: string;
      statusCategory: {
        name: string;
        id: string;
      };
    };
    priority?: {
      name: string;
      id: string;
    };
    assignee?: {
      displayName: string;
      emailAddress?: string;
      accountId: string;
    };
    reporter: {
      displayName: string;
      emailAddress?: string;
      accountId: string;
    };
    created: string;
    updated: string;
    resolutiondate?: string;
    labels: string[];
    components?: Array<{
      name: string;
      id: string;
    }>;
    customfield_10016?: number; // Story points
    customfield_10020?: Array<{
      id: string;
      name: string;
    }>; // Sprint
  };
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  simplified: boolean;
  style: string;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: "future" | "active" | "closed";
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  goal?: string;
}

export interface JiraBoard {
  id: number;
  name: string;
  type: string;
  location: {
    projectId?: number;
    projectKey?: string;
    projectName?: string;
  };
}

export interface JiraWorklog {
  id: string;
  issueId: string;
  timeSpentSeconds: number;
  started: string;
  author: {
    displayName: string;
    accountId: string;
  };
  comment?: string;
}

export interface JiraVelocity {
  sprintId: number;
  sprintName: string;
  estimated: number;
  completed: number;
  velocity: number;
}

export class JiraConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: JiraConfig;

  constructor(config: JiraConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: `${config.baseUrl}/rest/api/3`,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      auth: {
        username: config.email,
        password: config.apiToken,
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new ConnectorError("Invalid Jira credentials", error);
        }
        if (error.response?.status === 403) {
          throw new ConnectorError("Insufficient permissions for Jira API", error);
        }
        if (error.response?.status === 429) {
          throw new ConnectorError("Jira API rate limit exceeded", error);
        }
        throw new ConnectorError("Jira API error", error);
      }
    );
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/myself");
      return response.status === 200 && response.data.accountId;
    } catch (error) {
      throw new ConnectorError("Failed to test Jira connection", error);
    }
  }

  async getProjects(): Promise<JiraProject[]> {
    try {
      const response = await this.client.get("/project");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Jira projects", error);
    }
  }

  async getIssues(params?: {
    project?: string;
    assignee?: string;
    status?: string;
    issuetype?: string;
    createdAfter?: string;
    updatedAfter?: string;
    maxResults?: number;
  }): Promise<JiraIssue[]> {
    try {
      const jqlParts: string[] = [];

      if (params?.project) {
        jqlParts.push(`project = "${params.project}"`);
      }

      if (params?.assignee) {
        jqlParts.push(`assignee = "${params.assignee}"`);
      }

      if (params?.status) {
        jqlParts.push(`status = "${params.status}"`);
      }

      if (params?.issuetype) {
        jqlParts.push(`issuetype = "${params.issuetype}"`);
      }

      if (params?.createdAfter) {
        jqlParts.push(`created >= "${params.createdAfter}"`);
      }

      if (params?.updatedAfter) {
        jqlParts.push(`updated >= "${params.updatedAfter}"`);
      }

      const jql = jqlParts.join(" AND ") || "";
      const response = await this.client.get("/search", {
        params: {
          jql,
          maxResults: params?.maxResults || 50,
          fields: "*",
        },
      });

      return response.data.issues || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Jira issues", error);
    }
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      const response = await this.client.get(`/issue/${issueKey}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Jira issue ${issueKey}`, error);
    }
  }

  async createIssue(issueData: {
    project: { key: string };
    summary: string;
    description?: string;
    issuetype: { name: string };
    assignee?: { accountId: string };
    priority?: { name: string };
    labels?: string[];
    components?: Array<{ name: string }>;
  }): Promise<JiraIssue> {
    try {
      const fields: any = {
        project: issueData.project,
        summary: issueData.summary,
        issuetype: issueData.issuetype,
      };

      if (issueData.description) {
        fields.description = {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: issueData.description,
                },
              ],
            },
          ],
        };
      }

      if (issueData.assignee) fields.assignee = issueData.assignee;
      if (issueData.priority) fields.priority = issueData.priority;
      if (issueData.labels) fields.labels = issueData.labels;
      if (issueData.components) fields.components = issueData.components;

      const response = await this.client.post("/issue", { fields });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Jira issue", error);
    }
  }

  async updateIssue(
    issueKey: string,
    updateData: {
      summary?: string;
      description?: string;
      assignee?: { accountId: string } | null;
      status?: { name: string };
      priority?: { name: string };
      labels?: string[];
    }
  ): Promise<JiraIssue> {
    try {
      const fields: any = {};

      if (updateData.summary) fields.summary = updateData.summary;
      if (updateData.assignee !== undefined) fields.assignee = updateData.assignee;
      if (updateData.priority) fields.priority = updateData.priority;
      if (updateData.labels) fields.labels = updateData.labels;

      if (updateData.description) {
        fields.description = {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: updateData.description,
                },
              ],
            },
          ],
        };
      }

      await this.client.put(`/issue/${issueKey}`, { fields });

      // Handle status transition separately
      if (updateData.status) {
        await this.transitionIssue(issueKey, updateData.status.name);
      }

      return this.getIssue(issueKey);
    } catch (error) {
      throw new ConnectorError(`Failed to update Jira issue ${issueKey}`, error);
    }
  }

  async transitionIssue(issueKey: string, statusName: string): Promise<void> {
    try {
      // Get available transitions
      const transitionsResponse = await this.client.get(`/issue/${issueKey}/transitions`);
      const transition = transitionsResponse.data.transitions.find(
        (t: any) => t.name.toLowerCase() === statusName.toLowerCase()
      );

      if (!transition) {
        throw new Error(`Status transition "${statusName}" not available for issue ${issueKey}`);
      }

      await this.client.post(`/issue/${issueKey}/transitions`, {
        transition: { id: transition.id },
      });
    } catch (error) {
      throw new ConnectorError(`Failed to transition Jira issue ${issueKey}`, error);
    }
  }

  async getBoards(): Promise<JiraBoard[]> {
    try {
      const response = await this.client.get("/board");
      return response.data.values || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Jira boards", error);
    }
  }

  async getSprints(boardId: number): Promise<JiraSprint[]> {
    try {
      const response = await this.client.get(`/board/${boardId}/sprint`);
      return response.data.values || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Jira sprints", error);
    }
  }

  async getSprintIssues(boardId: number, sprintId: number): Promise<JiraIssue[]> {
    try {
      const response = await this.client.get(`/board/${boardId}/sprint/${sprintId}/issue`);
      return response.data.issues || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch sprint issues", error);
    }
  }

  async getWorklogs(issueKey: string): Promise<JiraWorklog[]> {
    try {
      const response = await this.client.get(`/issue/${issueKey}/worklog`);
      return response.data.worklogs || [];
    } catch (error) {
      throw new ConnectorError(`Failed to fetch worklogs for issue ${issueKey}`, error);
    }
  }

  async addWorklog(
    issueKey: string,
    worklog: {
      timeSpentSeconds: number;
      started: string;
      comment?: string;
    }
  ): Promise<JiraWorklog> {
    try {
      const response = await this.client.post(`/issue/${issueKey}/worklog`, worklog);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to add worklog to issue ${issueKey}`, error);
    }
  }

  async getVelocityReport(boardId: number): Promise<JiraVelocity[]> {
    try {
      const response = await this.client.get(`/board/${boardId}/velocityReport`);
      const sprints = response.data.velocityStatEntries || {};

      return Object.values(sprints).map((sprint: any) => ({
        sprintId: sprint.id,
        sprintName: sprint.name,
        estimated: sprint.estimated?.value || 0,
        completed: sprint.completed?.value || 0,
        velocity: sprint.completed?.value || 0,
      }));
    } catch (error) {
      throw new ConnectorError("Failed to fetch velocity report", error);
    }
  }

  async getUsers(params?: { username?: string; project?: string; maxResults?: number }): Promise<
    Array<{
      accountId: string;
      displayName: string;
      emailAddress?: string;
      active: boolean;
    }>
  > {
    try {
      const response = await this.client.get("/users/search", { params });
      return response.data || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Jira users", error);
    }
  }

  // Analytics methods
  async getIssueMetrics(projectKey?: string): Promise<{
    totalIssues: number;
    openIssues: number;
    closedIssues: number;
    avgResolutionTime: number;
    issuesByStatus: Record<string, number>;
    issuesByType: Record<string, number>;
    issuesByPriority: Record<string, number>;
  }> {
    try {
      const issues = await this.getIssues({
        project: projectKey,
        maxResults: 1000,
      });

      const metrics = {
        totalIssues: issues.length,
        openIssues: 0,
        closedIssues: 0,
        avgResolutionTime: 0,
        issuesByStatus: {} as Record<string, number>,
        issuesByType: {} as Record<string, number>,
        issuesByPriority: {} as Record<string, number>,
      };

      let totalResolutionTime = 0;
      let resolvedCount = 0;

      for (const issue of issues) {
        // Status counts
        const status = issue.fields.status.name;
        metrics.issuesByStatus[status] = (metrics.issuesByStatus[status] || 0) + 1;

        if (issue.fields.status.statusCategory.name === "Done") {
          metrics.closedIssues++;
        } else {
          metrics.openIssues++;
        }

        // Type counts
        const type = issue.fields.issuetype.name;
        metrics.issuesByType[type] = (metrics.issuesByType[type] || 0) + 1;

        // Priority counts
        if (issue.fields.priority) {
          const priority = issue.fields.priority.name;
          metrics.issuesByPriority[priority] = (metrics.issuesByPriority[priority] || 0) + 1;
        }

        // Resolution time
        if (issue.fields.resolutiondate && issue.fields.created) {
          const created = new Date(issue.fields.created).getTime();
          const resolved = new Date(issue.fields.resolutiondate).getTime();
          totalResolutionTime += resolved - created;
          resolvedCount++;
        }
      }

      if (resolvedCount > 0) {
        metrics.avgResolutionTime = totalResolutionTime / resolvedCount / (1000 * 60 * 60 * 24); // days
      }

      return metrics;
    } catch (error) {
      throw new ConnectorError("Failed to calculate issue metrics", error);
    }
  }
}

// Factory function for creating Jira connector
export function createJiraConnector(config: JiraConfig): JiraConnector {
  return new JiraConnector(config);
}
