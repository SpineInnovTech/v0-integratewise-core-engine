import { DurableObject } from "cloudflare:workers";
import type { Env, TwinCheckpoint } from "./types";

export class TwinState extends DurableObject<Env> {
  private checkpoint: TwinCheckpoint;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.checkpoint = {
      lastObserveRun: new Date(0).toISOString(),
      pendingProposals: [],
      lastMorningBrief: new Date(0).toISOString(),
      sessionId: crypto.randomUUID(),
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/checkpoint") {
      if (request.method === "GET") {
        return Response.json(this.checkpoint);
      }
      if (request.method === "POST") {
        const update = await request.json();
        this.checkpoint = { ...this.checkpoint, ...update };
        return Response.json(this.checkpoint);
      }
    }

    if (url.pathname === "/proposals/pending") {
      return Response.json(this.checkpoint.pendingProposals);
    }

    if (url.pathname === "/proposals/add") {
      const { proposalId } = await request.json();
      this.checkpoint.pendingProposals.push(proposalId);
      return Response.json({ added: proposalId });
    }

    if (url.pathname === "/proposals/resolve") {
      const { proposalId } = await request.json();
      this.checkpoint.pendingProposals = this.checkpoint.pendingProposals.filter(
        (id) => id !== proposalId
      );
      return Response.json({ resolved: proposalId });
    }

    return new Response("TwinState", { status: 200 });
  }

  getCheckpoint(): TwinCheckpoint {
    return this.checkpoint;
  }
}
