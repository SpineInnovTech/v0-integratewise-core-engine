import {
  SubscriptionMetricsAccelerator,
  FinanceAccelerator,
  SupportMarketingAccelerator,
} from "@integratewise/connectors";
import { registry } from "./index";

// Instantiate with dummy config for stateless execution
const sub = new SubscriptionMetricsAccelerator({ id: "sys-sub", source: "system" } as any);
const fin = new FinanceAccelerator({ id: "sys-fin", source: "system" } as any);
const mkt = new SupportMarketingAccelerator({ id: "sys-mkt", source: "system" } as any);

export async function runAcceleratorSignal(
  manifestId: string,
  signalName?: string,
  context: any = {}
) {
  const manifest = registry.get(manifestId);
  if (!manifest) return { error: "Manifest not found", id: manifestId };

  console.log(`[AcceleratorRunner] Executing ${manifest.name} (${manifestId})...`);

  try {
    // Map ID to Implementation Logic
    if (manifestId.includes("churn") || manifestId.includes("renewal")) {
      return {
        result: await sub.calculateChurn([], []),
        meta: "Direct execution via SubscriptionMetricsAccelerator",
      };
    }
    if (manifestId.includes("health")) {
      return {
        result: await sub.generateReport({ subscriptions: [] }),
        meta: "Direct execution via SubscriptionMetricsAccelerator",
      };
    }
    if (manifestId.includes("rev-forecast")) {
      return {
        result: await fin.analyzeHealth({}),
        meta: "Direct execution via FinanceAccelerator",
      };
    }
    if (manifestId.includes("mkt") || manifestId.includes("attrib")) {
      return {
        result: await mkt.analyzeAttribution([]),
        meta: "Direct execution via SupportMarketingAccelerator",
      };
    }

    // Default Simulation for unimplemented packs
    return {
      status: "simulated",
      message: "Logic pending specific implementation binding.",
      manifest: manifest.name,
      signal_output: {
        score: Math.floor(Math.random() * 100),
        confidence: 0.85,
        generated_at: new Date().toISOString(),
      },
    };
  } catch (e: any) {
    console.error("Accelerator Execution Error:", e);
    return { error: e.message };
  }
}
