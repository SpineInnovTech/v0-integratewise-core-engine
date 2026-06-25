import { WorkflowStep } from "cloudflare:workers";
import { AIProvider } from "@integratewise/lib";
import { AgentMessage, AgentTask, AgentResult, IntelligenceEnv } from "./types";

export abstract class BaseAgent {
  protected env: IntelligenceEnv;
  protected agentId: string;
  protected systemPrompt: string;

  // Model Tiering: Orchestrators get claude-3-5-sonnet/gemini-1.5-pro, Doers get gpt-4o
  protected model: string;
  protected isOrchestrator: boolean;

  constructor(
    env: IntelligenceEnv,
    agentId: string,
    systemPrompt: string,
    isOrchestrator: boolean = false
  ) {
    this.env = env;
    this.agentId = agentId;
    this.systemPrompt = systemPrompt;
    this.isOrchestrator = isOrchestrator;
    this.model = isOrchestrator ? "claude-3-5-sonnet-20241022" : "gpt-4o"; // Tier 1 vs Tier 2
  }

  /**
   * The "Training" Layer: Constructs the Master System Prompt based on the 6-layer memory
   * and the Unified Surface bi-directional sync mandate.
   */
  protected buildSystemPrompt(task?: AgentTask): string {
    let prompt = `${this.systemPrompt}\n\n`;

    if (!task || !task.context) return prompt;

    const ctx = task.context;

    prompt += `### Section A: Identity & The Unified Surface Mandate\n`;
    prompt += `You are the ${this.agentId}. IntegrateWise is a single, unified surface designed to eliminate multi-tab workflows. The user interacts exclusively with this surface. Your exact purpose is to act as the bi-directional sync engine. When a user or operator makes an edit here, you must translate and push that change back to the respective parent tool (e.g., Salesforce, HubSpot) to maintain absolute synchronization between the external system and our Spine.\n`;
    if (ctx.pipelineLocation) {
      prompt += `You are step [${ctx.pipelineLocation.currentStep}] in the [${ctx.pipelineLocation.pipelineName}] functional split. You receive data from [${ctx.pipelineLocation.previousStep || "none"}] and output to [${ctx.pipelineLocation.nextStep || "none"}].\n`;
    }
    prompt += `You are a stateless reference vessel; the Spine owns all memory.\n\n`;

    prompt += `### Section B: The Payload (Surface Edits to Sync)\n`;
    prompt += `You carry the following execution payload: ${task.objective}.\n`;
    if (ctx.payloadDeltas) {
      prompt += `The user has made the following specific edits on the unified surface: ${JSON.stringify(ctx.payloadDeltas)}. You must map these changes to the correct external parent tool format.\n`;
    }
    prompt += `\n`;

    prompt += `### Section C: Tools & Boundaries\n`;
    prompt += `You may only use the following tools: ${ctx.layer_1_skills?.join(", ") || "None specified"}. You are strictly prohibited from consolidating data or executing unapproved database writes.\n\n`;

    prompt += `### Section D: Doctrines & Regulations\n`;
    prompt += `Follow these unbreakable doctrines:\n`;
    (ctx.layer_4_doctrines || []).forEach((doc: string) => {
      prompt += `- ${doc}\n`;
    });
    prompt += `\n`;

    if (this.isOrchestrator) {
      prompt += `### Section E: The Morning Briefing Context\n`;
      prompt += `As an Orchestrator, synthesize the following memory layers to provide strategic direction:\n`;
      prompt += `- Evolutionary Memory (User Preferences): ${JSON.stringify(ctx.layer_6_evolutionary_memory || [])}\n`;
      prompt += `- Recent Dialog Memory: ${JSON.stringify(ctx.layer_5_memory || [])}\n`;
      prompt += `- Knowledge References: ${JSON.stringify(ctx.layer_2_knowledge || [])}\n`;
    }

    return prompt;
  }

  async think(messages: AgentMessage[], task?: AgentTask): Promise<string> {
    const ai = new AIProvider({
      openaiApiKey: (this.env as any).OPENAI_API_KEY,
      githubToken: (this.env as any).GITHUB_TOKEN,
      openrouterApiKey: (this.env as any).OPENROUTER_API_KEY,
      anthropicApiKey: (this.env as any).ANTHROPIC_API_KEY,
      defaultModel: task?.model || this.model,
      defaultProvider: task?.provider,
    });

    const dynamicPrompt = this.buildSystemPrompt(task);

    const result = await ai.complete([{ role: "system", content: dynamicPrompt }, ...messages]);
    return result.content;
  }

  abstract execute(task: AgentTask, step: WorkflowStep): Promise<AgentResult>;
}
