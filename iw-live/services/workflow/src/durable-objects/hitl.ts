export interface HITLEnv {
  ACT?: Fetcher;
}

type HitlRecord = {
  signal_id: string;
  spine_id?: string;
  workspace_id?: string;
  status: "pending" | "approved" | "rejected";
  created_at: number;
  resolved_at?: number;
  resolved_by?: string;
  [key: string]: unknown;
};

export class HITLGate {
  private state: DurableObjectState;
  private env: HITLEnv;

  constructor(state: DurableObjectState, env: HITLEnv) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/create" && request.method === "POST") {
      const { signal_id, analysis, workspace_id, spine_id } = (await request.json()) as Record<
        string,
        any
      >;
      if (!signal_id) {
        return new Response(JSON.stringify({ error: "signal_id required" }), { status: 400 });
      }

      const record: HitlRecord = {
        signal_id,
        spine_id,
        workspace_id,
        ...(analysis || {}),
        status: "pending",
        created_at: Date.now(),
      };
      await this.state.storage.put(`hitl:${signal_id}`, record);
      return new Response(JSON.stringify({ status: "pending", signal_id }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/resolve" && request.method === "POST") {
      const { signal_id, decision, user_id } = (await request.json()) as Record<string, any>;
      if (!signal_id || !decision) {
        return new Response(JSON.stringify({ error: "signal_id and decision required" }), {
          status: 400,
        });
      }

      const pending = await this.state.storage.get<HitlRecord>(`hitl:${signal_id}`);
      if (!pending) {
        return new Response(JSON.stringify({ error: "signal not found" }), { status: 404 });
      }

      if (decision === "approved") {
        // KT NOTE: Must include approval_token when calling Act (Rule 5)
        const approvalToken = pending.approval_token || crypto.randomUUID();
        const executePayload = {
          action: pending.recommended_action,
          signal_id,
          spine_id: pending.spine_id,
          workspace_id: pending.workspace_id,
          analysis: pending,
          approval_token: approvalToken, // Required by KT Note
        };

        let executeResponse: Response | null = null;
        if (this.env.ACT) {
          executeResponse = await this.env.ACT.fetch(
            new Request("http://act/execute", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-tenant-id": String(pending.workspace_id || "default"),
                "x-approval-token": approvalToken,
              },
              body: JSON.stringify(executePayload),
            })
          );
        } else {
          executeResponse = await fetch("https://act.integratewise.online/execute", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-approval-token": approvalToken,
            },
            body: JSON.stringify(executePayload),
          });
        }

        if (!executeResponse || !executeResponse.ok) {
          return new Response(JSON.stringify({ status: "execution_failed" }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }

        await this.state.storage.put(`hitl:${signal_id}`, {
          ...pending,
          status: "approved",
          resolved_by: user_id,
          resolved_at: Date.now(),
        } satisfies HitlRecord);
        return new Response(JSON.stringify({ status: "executed" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      await this.state.storage.put(`hitl:${signal_id}`, {
        ...pending,
        status: "rejected",
        resolved_by: user_id,
        resolved_at: Date.now(),
      } satisfies HitlRecord);
      return new Response(JSON.stringify({ status: "rejected" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/status" && request.method === "GET") {
      const signalId = url.searchParams.get("signal_id");
      if (!signalId) {
        return new Response(JSON.stringify({ error: "signal_id required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const record = await this.state.storage.get<HitlRecord>(`hitl:${signalId}`);
      if (!record) {
        return new Response(JSON.stringify({ error: "signal not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(record), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/count" && request.method === "GET") {
      const list = await this.state.storage.list<HitlRecord>({ prefix: "hitl:" });
      let pending = 0;
      for (const [, item] of list) {
        if (item.status === "pending") pending += 1;
      }
      return new Response(JSON.stringify({ pending }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }
}
