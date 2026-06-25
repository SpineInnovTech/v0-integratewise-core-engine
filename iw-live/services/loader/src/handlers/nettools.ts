/**
 * Network Tools and Diagnostics Handlers
 * Network connectivity, DNS, and diagnostic utilities
 */

import type { Context } from "hono";

type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

/**
 * HTTP connectivity test
 */
export async function httpConnectivityHandler(c: Context) {
  const log = c.get("log") as Log;
  const url = c.req.query("url");

  if (!url) {
    return c.json({ error: "Missing required parameter: url" }, 400);
  }

  try {
    const startTime = Date.now();

    // Basic HTTP connectivity check
    const response = await fetch(url, {
      method: "HEAD", // Use HEAD to minimize data transfer
      headers: {
        "User-Agent": "IntegrateWise-NetTools/1.0",
      },
      // Set a reasonable timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const duration = Date.now() - startTime;

    const result = {
      url,
      status: "reachable",
      http_status: response.status,
      http_status_text: response.statusText,
      response_time_ms: duration,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString(),
    };

    log.info("HTTP connectivity test completed", { url, status: response.status, duration });
    return c.json(result);
  } catch (error) {
    const result = {
      url,
      status: "unreachable",
      error: error instanceof Error ? error.message : "Unknown error",
      error_type: error instanceof Error ? error.name : "Unknown",
      timestamp: new Date().toISOString(),
    };

    log.warn("HTTP connectivity test failed", { url, error: result.error });
    return c.json(result, 200); // Return 200 since this is expected for unreachable hosts
  }
}

/**
 * DNS resolution test
 */
export async function dnsResolutionHandler(c: Context) {
  const log = c.get("log") as Log;
  const hostname = c.req.query("hostname");

  if (!hostname) {
    return c.json({ error: "Missing required parameter: hostname" }, 400);
  }

  try {
    // Note: In Cloudflare Workers, we can't directly resolve DNS
    // We'll use a simple HTTP request to test if the hostname resolves
    const testUrl = `https://${hostname}`;
    const startTime = Date.now();

    const response = await fetch(testUrl, {
      method: "HEAD",
      headers: {
        "User-Agent": "IntegrateWise-NetTools/1.0",
      },
      signal: AbortSignal.timeout(5000),
    });

    const duration = Date.now() - startTime;

    const result = {
      hostname,
      status: "resolves",
      http_status: response.status,
      response_time_ms: duration,
      ip_address: "unknown", // Workers doesn't expose IP resolution
      timestamp: new Date().toISOString(),
    };

    log.info("DNS resolution test completed", { hostname, status: "resolves", duration });
    return c.json(result);
  } catch (error) {
    // If we get a DNS error, it will manifest as a fetch error
    const result = {
      hostname,
      status: "does_not_resolve",
      error: error instanceof Error ? error.message : "Unknown error",
      error_type: error instanceof Error ? error.name : "Unknown",
      timestamp: new Date().toISOString(),
    };

    log.warn("DNS resolution test failed", { hostname, error: result.error });
    return c.json(result, 200);
  }
}

/**
 * Service-to-service connectivity test
 */
export async function serviceConnectivityHandler(c: Context) {
  const log = c.get("log") as Log;
  const service = c.req.query("service");

  if (!service) {
    return c.json({ error: "Missing required parameter: service" }, 400);
  }

  const serviceUrls: Record<string, string> = {
    normalizer: c.env.NORMALIZER_URL,
    store: c.env.STORE_URL,
    spine: "https://spine.integratewise.ai",
    gateway: "https://gateway.integratewise.ai",
    knowledge: "https://knowledge.integratewise.ai",
    think: "https://think.integratewise.ai",
    iqhub: "https://iq-hub.integratewise.ai",
    govern: "https://govern.integratewise.ai",
    admin: "https://admin.integratewise.ai",
    act: "https://act.integratewise.ai",
  };

  const targetUrl = serviceUrls[service.toLowerCase()];

  if (!targetUrl) {
    return c.json(
      {
        error: "Unknown service",
        available_services: Object.keys(serviceUrls),
      },
      400
    );
  }

  try {
    const startTime = Date.now();

    const response = await fetch(`${targetUrl}/health`, {
      method: "GET",
      headers: {
        "User-Agent": "IntegrateWise-NetTools/1.0",
      },
      signal: AbortSignal.timeout(5000),
    });

    const duration = Date.now() - startTime;

    const result = {
      service,
      url: targetUrl,
      status: response.ok ? "healthy" : "unhealthy",
      http_status: response.status,
      response_time_ms: duration,
      timestamp: new Date().toISOString(),
    };

    log.info("Service connectivity test completed", { service, status: result.status, duration });
    return c.json(result);
  } catch (error) {
    const result = {
      service,
      url: targetUrl,
      status: "unreachable",
      error: error instanceof Error ? error.message : "Unknown error",
      error_type: error instanceof Error ? error.name : "Unknown",
      timestamp: new Date().toISOString(),
    };

    log.error("Service connectivity test failed", { service, error: result.error });
    return c.json(result, 200);
  }
}

/**
 * Network diagnostics overview
 */
export async function networkDiagnosticsHandler(c: Context) {
  const log = c.get("log") as Log;

  try {
    // Test connectivity to key services
    const services = ["normalizer", "store", "spine", "gateway"];
    const diagnostics = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const response = await fetch(
            `${c.env[`${service.toUpperCase()}_URL`] || `https://${service}.integratewise.ai`}/health`,
            {
              method: "GET",
              signal: AbortSignal.timeout(3000),
            }
          );
          return {
            service,
            status: response.ok ? "healthy" : "unhealthy",
            response_time_ms: 0, // Would need to measure this properly
          };
        } catch (error) {
          return {
            service,
            status: "unreachable",
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    const results = diagnostics.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : {
            service: "unknown",
            status: "error",
            error: "Test failed",
          }
    );

    const summary = {
      total_services: results.length,
      healthy: results.filter((r) => r.status === "healthy").length,
      unhealthy: results.filter((r) => r.status === "unhealthy").length,
      unreachable: results.filter((r) => r.status === "unreachable").length,
    };

    const result = {
      status: summary.unhealthy === 0 && summary.unreachable === 0 ? "healthy" : "degraded",
      summary,
      services: results,
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT,
    };

    log.info("Network diagnostics completed", summary);
    return c.json(result);
  } catch (error) {
    log.error("Network diagnostics failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return c.json({ error: "Failed to run network diagnostics" }, 500);
  }
}

/**
 * Get available network tools
 */
export async function nettoolsInfoHandler(c: Context) {
  const log = c.get("log") as Log;

  const tools = [
    {
      id: "http-connectivity",
      name: "HTTP Connectivity Test",
      description: "Test HTTP/HTTPS connectivity to any URL",
      endpoint: "/nettools/http-connectivity",
      parameters: {
        url: "string (required) - URL to test",
      },
      example: "/nettools/http-connectivity?url=https://api.example.com",
    },
    {
      id: "dns-resolution",
      name: "DNS Resolution Test",
      description: "Test if a hostname resolves and is reachable",
      endpoint: "/nettools/dns-resolution",
      parameters: {
        hostname: "string (required) - Hostname to test",
      },
      example: "/nettools/dns-resolution?hostname=api.example.com",
    },
    {
      id: "service-connectivity",
      name: "Service Connectivity Test",
      description: "Test connectivity to internal IntegrateWise services",
      endpoint: "/nettools/service-connectivity",
      parameters: {
        service: "string (required) - Service name (normalizer, store, spine, etc.)",
      },
      example: "/nettools/service-connectivity?service=spine",
    },
    {
      id: "network-diagnostics",
      name: "Network Diagnostics",
      description: "Run comprehensive network diagnostics across all services",
      endpoint: "/nettools/diagnostics",
      parameters: {},
      example: "/nettools/diagnostics",
    },
  ];

  log.info("Nettools info requested");
  return c.json({
    tools,
    total: tools.length,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
