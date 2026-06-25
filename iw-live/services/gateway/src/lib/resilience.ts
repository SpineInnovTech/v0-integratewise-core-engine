/**
 * Resilience Layer — retry, timeout, circuit breaker, graceful degradation.
 *
 * High Availability Measures:
 * - Retry with exponential backoff (configurable max retries, base delay)
 * - Timeout per attempt (configurable, default 10s)
 * - Circuit breaker per downstream service (tracks failures in memory)
 * - Graceful degradation (503 response when circuit open)
 * - Model/provider switch for AI routes (fallback chain)
 */

export interface ResilienceConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
  circuitThreshold: number;
  circuitWindowMs: number;
  circuitCooldownMs: number;
}

const DEFAULT_CONFIG: ResilienceConfig = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000,
  timeoutMs: 10000,
  circuitThreshold: 5,
  circuitWindowMs: 60000,
  circuitCooldownMs: 30000,
};

type CircuitState = {
  status: "closed" | "open" | "half-open";
  failures: number;
  lastFailure: number;
  openedAt: number;
};

const circuitStates = new Map<string, CircuitState>();

function getCircuitKey(service: string, tenantId?: string): string {
  return tenantId ? `circuit:${service}:${tenantId}` : `circuit:${service}`;
}

function getCircuit(service: string, tenantId?: string): CircuitState {
  const key = getCircuitKey(service, tenantId);
  let state = circuitStates.get(key);
  if (!state) {
    state = { status: "closed", failures: 0, lastFailure: 0, openedAt: 0 };
    circuitStates.set(key, state);
  }
  return state;
}

function recordFailure(service: string, tenantId?: string): void {
  const state = getCircuit(service, tenantId);
  const now = Date.now();
  if (now - state.lastFailure > DEFAULT_CONFIG.circuitWindowMs) {
    state.failures = 0;
  }
  state.failures++;
  state.lastFailure = now;
  if (state.status === "closed" && state.failures >= DEFAULT_CONFIG.circuitThreshold) {
    state.status = "open";
    state.openedAt = now;
    console.warn(`[CircuitBreaker] OPEN for ${service}${tenantId ? "/" + tenantId : ""}`);
  }
}

function recordSuccess(service: string, tenantId?: string): void {
  const state = getCircuit(service, tenantId);
  if (state.status === "half-open") {
    state.status = "closed";
    state.failures = 0;
    console.info(`[CircuitBreaker] CLOSED for ${service}${tenantId ? "/" + tenantId : ""}`);
  } else if (state.status === "closed") {
    state.failures = Math.max(0, state.failures - 1);
  }
}

function isCircuitOpen(service: string, tenantId?: string): boolean {
  const state = getCircuit(service, tenantId);
  const now = Date.now();
  if (state.status === "open") {
    if (now - state.openedAt > DEFAULT_CONFIG.circuitCooldownMs) {
      state.status = "half-open";
      console.info(`[CircuitBreaker] HALF-OPEN for ${service}${tenantId ? "/" + tenantId : ""}`);
      return false;
    }
    return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  fetcher: Fetcher,
  request: Request,
  timeoutMs: number
): Promise<Response> {
  const responsePromise = fetcher.fetch(request);
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs);
  });
  return await Promise.race([responsePromise, timeoutPromise]);
}

export async function resilientFetch(
  serviceName: string,
  fetcher: Fetcher,
  request: Request,
  tenantId?: string,
  config?: Partial<ResilienceConfig>
): Promise<Response> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (isCircuitOpen(serviceName, tenantId)) {
    return new Response(
      JSON.stringify({
        error: "Service temporarily unavailable",
        service: serviceName,
        reason: "circuit_open",
      }),
      { status: 503, headers: { "Content-Type": "application/json", "x-circuit-state": "open" } }
    );
  }

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      // Clone request if there is a body and we might retry, to avoid "used body" errors
      const reqToFetch = request.body && attempt < cfg.maxRetries ? request.clone() : request;
      const response = await fetchWithTimeout(fetcher, reqToFetch, cfg.timeoutMs);
      if (response.status >= 500) {
        recordFailure(serviceName, tenantId);
        lastError = new Error(`HTTP ${response.status}`);
        console.warn(
          `[Resilience] ${serviceName} attempt ${attempt} failed with HTTP ${response.status}`
        );
      } else {
        recordSuccess(serviceName, tenantId);
        return response;
      }
    } catch (err: any) {
      recordFailure(serviceName, tenantId);
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[Resilience] ${serviceName} attempt ${attempt} threw error: ${lastError.message}`
      );
    }

    if (attempt < cfg.maxRetries) {
      const delay = Math.min(cfg.baseDelayMs * Math.pow(2, attempt), cfg.maxDelayMs);
      console.log(
        `[Resilience] Retry ${serviceName} attempt ${attempt + 1}/${cfg.maxRetries} in ${delay}ms`
      );
      await sleep(delay);
    }
  }

  return new Response(
    JSON.stringify({
      error: "Service unavailable after retries",
      service: serviceName,
      reason: lastError?.message || "unknown",
      retries: cfg.maxRetries,
    }),
    { status: 502, headers: { "Content-Type": "application/json" } }
  );
}

export async function probeService(
  _serviceName: string,
  fetcher: Fetcher,
  timeoutMs = 5000
): Promise<{ healthy: boolean; latencyMs: number; status?: number; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(
      fetcher,
      new Request("http://internal/health", { method: "GET" }),
      timeoutMs
    );
    const latencyMs = Date.now() - start;
    return { healthy: res.ok, latencyMs, status: res.status };
  } catch (err) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface ModelFallbackConfig {
  primary: string;
  secondary: string;
  tertiary: string;
}

export const DEFAULT_MODEL_CHAIN: ModelFallbackConfig = {
  primary: "kimi",
  secondary: "claude",
  tertiary: "gpt-4o",
};

export async function modelSwitchFetch(
  fetcher: Fetcher,
  request: Request,
  chain: ModelFallbackConfig = DEFAULT_MODEL_CHAIN
): Promise<Response> {
  const models = [chain.primary, chain.secondary, chain.tertiary];
  for (const model of models) {
    try {
      const switchedRequest = new Request(request, {
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          "x-model-override": model,
        },
      });
      const response = await fetchWithTimeout(fetcher, switchedRequest, 15000);
      if (response.ok) {
        response.headers.set("x-model-used", model);
        return response;
      }
      console.warn(`[ModelSwitch] ${model} returned ${response.status}, trying next...`);
    } catch (err) {
      console.warn(`[ModelSwitch] ${model} failed:`, err);
    }
  }
  return new Response(JSON.stringify({ error: "All AI models unavailable", attempted: models }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}
