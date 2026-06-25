import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Asana Connector — Asana REST API v1.0
// ============================================================================

export interface AsanaConfig extends ConnectorConfig {
  accessToken: string;
  baseUrl?: string;
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
  is_organization: boolean;
}

export interface AsanaProject {
  gid: string;
  name: string;
  notes: string;
  color: string | null;
  archived: boolean;
  created_at: string;
  modified_at: string;
  due_date: string | null;
  start_on: string | null;
  current_status: {
    gid: string;
    title: string;
    color: string;
    text: string;
    author: { gid: string; name: string };
  } | null;
  default_view: string;
  workspace: { gid: string; name: string };
  team: { gid: string; name: string } | null;
  members: Array<{ gid: string; name: string }>;
  owner: { gid: string; name: string } | null;
  public: boolean;
}

export interface AsanaTask {
  gid: string;
  name: string;
  notes: string;
  html_notes?: string;
  completed: boolean;
  completed_at: string | null;
  assignee: { gid: string; name: string } | null;
  assignee_status: string;
  created_at: string;
  modified_at: string;
  due_on: string | null;
  due_at: string | null;
  start_on: string | null;
  start_at: string | null;
  tags: Array<{ gid: string; name: string }>;
  projects: Array<{ gid: string; name: string }>;
  parent: { gid: string; name: string } | null;
  workspace: { gid: string; name: string };
  custom_fields: Array<{
    gid: string;
    name: string;
    type: string;
    display_value: string | null;
    [key: string]: any;
  }>;
  followers: Array<{ gid: string; name: string }>;
  num_subtasks: number;
  permalink_url: string;
}

export interface AsanaSection {
  gid: string;
  name: string;
  created_at: string;
  project: { gid: string; name: string };
}

export interface AsanaStory {
  gid: string;
  type: "comment" | "system";
  text: string;
  html_text?: string;
  created_at: string;
  created_by: { gid: string; name: string };
  resource_subtype: string;
}

export interface AsanaUser {
  gid: string;
  name: string;
  email: string;
  photo: { image_128x128: string } | null;
  workspaces: AsanaWorkspace[];
}

export interface AsanaTag {
  gid: string;
  name: string;
  color: string | null;
  notes: string;
  workspace: { gid: string; name: string };
}

export interface AsanaWebhook {
  gid: string;
  resource: { gid: string; name: string };
  target: string;
  active: boolean;
  created_at: string;
  filters: Array<{ resource_type: string; action: string; fields?: string[] }>;
}

export interface AsanaListParams {
  limit?: number;
  offset?: string;
  opt_fields?: string;
}

export class AsanaConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: AsanaConfig;

  constructor(config: AsanaConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://app.asana.com/api/1.0",
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const errors = error.response?.data?.errors;
        const msg = errors?.[0]?.message || error.message;
        if (status === 401) throw new ConnectorError("Invalid Asana access token", error);
        if (status === 403) throw new ConnectorError(`Asana permission denied: ${msg}`, error);
        if (status === 404) throw new ConnectorError(`Asana resource not found: ${msg}`, error);
        if (status === 429) {
          const retryAfter = error.response?.headers?.["retry-after"];
          throw new ConnectorError(`Asana rate limit exceeded. Retry after ${retryAfter}s`, error);
        }
        throw new ConnectorError(`Asana API error: ${msg}`, error);
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "asana",
      name: "Asana",
      version: "1.0.0",
      apiVersion: "v1.0",
      capabilities: { sync: true, webhooks: true },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/users/me");
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  async getMe(): Promise<AsanaUser> {
    try {
      const response = await this.client.get("/users/me", {
        params: {
          opt_fields: "name,email,photo,workspaces,workspaces.name,workspaces.is_organization",
        },
      });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError("Failed to get current Asana user", error);
    }
  }

  async getUser(userGid: string): Promise<AsanaUser> {
    try {
      const response = await this.client.get(`/users/${userGid}`, {
        params: { opt_fields: "name,email,photo,workspaces" },
      });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get Asana user ${userGid}`, error);
    }
  }

  async listUsersInWorkspace(
    workspaceGid: string,
    params?: AsanaListParams
  ): Promise<{ data: AsanaUser[]; next_page: { offset: string; uri: string } | null }> {
    try {
      const response = await this.client.get(`/workspaces/${workspaceGid}/users`, {
        params: {
          limit: params?.limit || 50,
          offset: params?.offset,
          opt_fields: params?.opt_fields || "name,email",
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Asana users", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Workspaces
  // ---------------------------------------------------------------------------
  async listWorkspaces(): Promise<AsanaWorkspace[]> {
    try {
      const response = await this.client.get("/workspaces", {
        params: { opt_fields: "name,is_organization" },
      });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Asana workspaces", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------------
  async listProjects(
    workspaceGid: string,
    params?: AsanaListParams & { archived?: boolean; team?: string }
  ): Promise<{ data: AsanaProject[]; next_page: any }> {
    try {
      const response = await this.client.get("/projects", {
        params: {
          workspace: workspaceGid,
          limit: params?.limit || 50,
          offset: params?.offset,
          archived: params?.archived,
          team: params?.team,
          opt_fields:
            params?.opt_fields ||
            "name,notes,color,archived,created_at,modified_at,due_date,current_status,owner,owner.name,public",
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Asana projects", error);
    }
  }

  async getProject(projectGid: string): Promise<AsanaProject> {
    try {
      const response = await this.client.get(`/projects/${projectGid}`, {
        params: {
          opt_fields:
            "name,notes,color,archived,created_at,modified_at,due_date,start_on,current_status,default_view,workspace,workspace.name,team,team.name,members,members.name,owner,owner.name,public",
        },
      });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get Asana project ${projectGid}`, error);
    }
  }

  async createProject(
    workspaceGid: string,
    body: {
      name: string;
      notes?: string;
      color?: string;
      team?: string;
      due_date?: string;
      start_on?: string;
      default_view?: string;
      public?: boolean;
    }
  ): Promise<AsanaProject> {
    try {
      const response = await this.client.post("/projects", {
        data: { workspace: workspaceGid, ...body },
      });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Asana project", error);
    }
  }

  async updateProject(
    projectGid: string,
    updates: Partial<{
      name: string;
      notes: string;
      color: string;
      archived: boolean;
      due_date: string;
      start_on: string;
      public: boolean;
    }>
  ): Promise<AsanaProject> {
    try {
      const response = await this.client.put(`/projects/${projectGid}`, { data: updates });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update Asana project ${projectGid}`, error);
    }
  }

  async deleteProject(projectGid: string): Promise<void> {
    try {
      await this.client.delete(`/projects/${projectGid}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete Asana project ${projectGid}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------------------------
  async listTasks(
    projectGid: string,
    params?: AsanaListParams & { completed_since?: string }
  ): Promise<{ data: AsanaTask[]; next_page: any }> {
    try {
      const response = await this.client.get(`/projects/${projectGid}/tasks`, {
        params: {
          limit: params?.limit || 50,
          offset: params?.offset,
          completed_since: params?.completed_since,
          opt_fields:
            params?.opt_fields ||
            "name,completed,assignee,assignee.name,due_on,due_at,created_at,modified_at,tags,tags.name,custom_fields,num_subtasks,permalink_url",
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list tasks for project ${projectGid}`, error);
    }
  }

  async getTask(taskGid: string): Promise<AsanaTask> {
    try {
      const response = await this.client.get(`/tasks/${taskGid}`, {
        params: {
          opt_fields:
            "name,notes,html_notes,completed,completed_at,assignee,assignee.name,assignee_status,created_at,modified_at,due_on,due_at,start_on,start_at,tags,tags.name,projects,projects.name,parent,parent.name,workspace,workspace.name,custom_fields,followers,followers.name,num_subtasks,permalink_url",
        },
      });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get Asana task ${taskGid}`, error);
    }
  }

  async createTask(body: {
    workspace: string;
    name: string;
    notes?: string;
    html_notes?: string;
    assignee?: string;
    projects?: string[];
    due_on?: string;
    due_at?: string;
    start_on?: string;
    tags?: string[];
    parent?: string;
    custom_fields?: Record<string, any>;
  }): Promise<AsanaTask> {
    try {
      const response = await this.client.post("/tasks", { data: body });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Asana task", error);
    }
  }

  async updateTask(
    taskGid: string,
    updates: Partial<{
      name: string;
      notes: string;
      html_notes: string;
      completed: boolean;
      assignee: string | null;
      due_on: string | null;
      due_at: string | null;
      start_on: string | null;
      custom_fields: Record<string, any>;
    }>
  ): Promise<AsanaTask> {
    try {
      const response = await this.client.put(`/tasks/${taskGid}`, { data: updates });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update Asana task ${taskGid}`, error);
    }
  }

  async deleteTask(taskGid: string): Promise<void> {
    try {
      await this.client.delete(`/tasks/${taskGid}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete Asana task ${taskGid}`, error);
    }
  }

  async addTaskToProject(taskGid: string, projectGid: string, sectionGid?: string): Promise<void> {
    try {
      await this.client.post(`/tasks/${taskGid}/addProject`, {
        data: { project: projectGid, section: sectionGid },
      });
    } catch (error) {
      throw new ConnectorError(`Failed to add task ${taskGid} to project ${projectGid}`, error);
    }
  }

  async removeTaskFromProject(taskGid: string, projectGid: string): Promise<void> {
    try {
      await this.client.post(`/tasks/${taskGid}/removeProject`, { data: { project: projectGid } });
    } catch (error) {
      throw new ConnectorError(
        `Failed to remove task ${taskGid} from project ${projectGid}`,
        error
      );
    }
  }

  async listSubtasks(
    taskGid: string,
    params?: AsanaListParams
  ): Promise<{ data: AsanaTask[]; next_page: any }> {
    try {
      const response = await this.client.get(`/tasks/${taskGid}/subtasks`, {
        params: {
          limit: params?.limit || 50,
          offset: params?.offset,
          opt_fields: params?.opt_fields || "name,completed,assignee,assignee.name,due_on",
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list subtasks for task ${taskGid}`, error);
    }
  }

  async setTaskParent(taskGid: string, parentGid: string | null): Promise<AsanaTask> {
    try {
      const response = await this.client.post(`/tasks/${taskGid}/setParent`, {
        data: { parent: parentGid },
      });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError(`Failed to set parent for task ${taskGid}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Sections
  // ---------------------------------------------------------------------------
  async listSections(
    projectGid: string,
    params?: AsanaListParams
  ): Promise<{ data: AsanaSection[] }> {
    try {
      const response = await this.client.get(`/projects/${projectGid}/sections`, {
        params: { limit: params?.limit || 100, offset: params?.offset },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list sections for project ${projectGid}`, error);
    }
  }

  async createSection(
    projectGid: string,
    name: string,
    insertBefore?: string,
    insertAfter?: string
  ): Promise<AsanaSection> {
    try {
      const response = await this.client.post(`/projects/${projectGid}/sections`, {
        data: { name, insert_before: insertBefore, insert_after: insertAfter },
      });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create section in project ${projectGid}`, error);
    }
  }

  async addTaskToSection(sectionGid: string, taskGid: string): Promise<void> {
    try {
      await this.client.post(`/sections/${sectionGid}/addTask`, { data: { task: taskGid } });
    } catch (error) {
      throw new ConnectorError(`Failed to add task to section ${sectionGid}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Stories (comments and activity)
  // ---------------------------------------------------------------------------
  async listStories(taskGid: string, params?: AsanaListParams): Promise<{ data: AsanaStory[] }> {
    try {
      const response = await this.client.get(`/tasks/${taskGid}/stories`, {
        params: {
          limit: params?.limit || 50,
          offset: params?.offset,
          opt_fields:
            params?.opt_fields ||
            "type,text,html_text,created_at,created_by,created_by.name,resource_subtype",
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list stories for task ${taskGid}`, error);
    }
  }

  async addComment(taskGid: string, text: string, isHtml = false): Promise<AsanaStory> {
    try {
      const body = isHtml ? { html_text: text } : { text };
      const response = await this.client.post(`/tasks/${taskGid}/stories`, { data: body });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError(`Failed to add comment to task ${taskGid}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Tags
  // ---------------------------------------------------------------------------
  async listTags(workspaceGid: string, params?: AsanaListParams): Promise<{ data: AsanaTag[] }> {
    try {
      const response = await this.client.get("/tags", {
        params: {
          workspace: workspaceGid,
          limit: params?.limit || 50,
          offset: params?.offset,
          opt_fields: "name,color,notes",
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Asana tags", error);
    }
  }

  async createTag(
    workspaceGid: string,
    name: string,
    color?: string,
    notes?: string
  ): Promise<AsanaTag> {
    try {
      const response = await this.client.post("/tags", {
        data: { workspace: workspaceGid, name, color, notes },
      });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Asana tag", error);
    }
  }

  async addTagToTask(taskGid: string, tagGid: string): Promise<void> {
    try {
      await this.client.post(`/tasks/${taskGid}/addTag`, { data: { tag: tagGid } });
    } catch (error) {
      throw new ConnectorError(`Failed to add tag to task ${taskGid}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Webhooks
  // ---------------------------------------------------------------------------
  async listWebhooks(
    workspaceGid: string,
    params?: { resource?: string }
  ): Promise<{ data: AsanaWebhook[] }> {
    try {
      const response = await this.client.get("/webhooks", {
        params: { workspace: workspaceGid, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Asana webhooks", error);
    }
  }

  async createWebhook(
    resourceGid: string,
    targetUrl: string,
    filters?: Array<{ resource_type: string; action: string; fields?: string[] }>
  ): Promise<AsanaWebhook> {
    try {
      const response = await this.client.post("/webhooks", {
        data: { resource: resourceGid, target: targetUrl, filters },
      });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Asana webhook", error);
    }
  }

  async deleteWebhook(webhookGid: string): Promise<void> {
    try {
      await this.client.delete(`/webhooks/${webhookGid}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete Asana webhook ${webhookGid}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------
  async searchTasks(
    workspaceGid: string,
    params: {
      text?: string;
      "projects.any"?: string;
      "assignee.any"?: string;
      completed?: boolean;
      "due_on.before"?: string;
      "due_on.after"?: string;
      "modified_at.after"?: string;
      sort_by?: "due_date" | "created_at" | "completed_at" | "likes" | "modified_at";
      sort_ascending?: boolean;
      opt_fields?: string;
    }
  ): Promise<{ data: AsanaTask[] }> {
    try {
      const response = await this.client.get(`/workspaces/${workspaceGid}/tasks/search`, {
        params: {
          opt_fields:
            params.opt_fields || "name,completed,assignee,assignee.name,due_on,permalink_url",
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to search Asana tasks", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Pagination helper
  // ---------------------------------------------------------------------------
  async *paginateTasks(
    projectGid: string,
    completedSince?: string
  ): AsyncGenerator<AsanaTask[], void, undefined> {
    let offset: string | undefined;
    let hasMore = true;
    while (hasMore) {
      const result = await this.listTasks(projectGid, {
        limit: 100,
        offset,
        completed_since: completedSince,
      });
      yield result.data;
      hasMore = !!result.next_page;
      offset = result.next_page?.offset;
    }
  }
}

export function createAsanaConnector(config: AsanaConfig): AsanaConnector {
  return new AsanaConnector(config);
}
