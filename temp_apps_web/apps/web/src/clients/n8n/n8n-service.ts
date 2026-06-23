// Shim for N8n Service and OpenRouter Service

export interface N8nWorkflow {
  id: string;
  name: string;
  [key: string]: any;
}

export interface N8nExecution {
  id: string;
  status: string;
  [key: string]: any;
}

export class N8nService {
  static async getWorkflows(): Promise<N8nWorkflow[]> {
    return [];
  }

  static async getWorkflow(id: string): Promise<N8nWorkflow | null> {
    return null;
  }

  static async executeWorkflow(id: string, data?: any): Promise<N8nExecution> {
    return { id: "", status: "idle" };
  }

  static async getExecutions(workflowId: string): Promise<N8nExecution[]> {
    return [];
  }

  static async getExecution(id: string): Promise<N8nExecution | null> {
    return null;
  }
}

export class OpenRouterService {
  static async callModel(model: string, prompt: string, options?: any): Promise<string> {
    return "";
  }

  static async generateText(prompt: string, options?: any): Promise<string> {
    return "";
  }
}

export default N8nService;
