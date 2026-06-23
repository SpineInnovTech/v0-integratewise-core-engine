import type { Plugin, OutputBundle } from "vite";

/**
 * Vite plugin: no-supabase-gateway-proxy
 *
 * When VITE_SPINE_PROVIDER=gateway-proxy, the app talks to the CF Gateway
 * instead of Supabase directly. This plugin enforces that @supabase/supabase-js
 * does NOT end up in the production bundle for that build mode.
 *
 * Fails the build at bundle generation time if any output chunk contains
 * references to the Supabase SDK.
 */
export default function noSupabaseGatewayProxy(): Plugin {
  const isGatewayProxy = process.env.VITE_SPINE_PROVIDER === "gateway-proxy";

  return {
    name: "no-supabase-gateway-proxy",
    apply: "build",

    generateBundle(_options, bundle: OutputBundle) {
      if (!isGatewayProxy) return;

      const violations: string[] = [];

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "chunk") continue;

        // Check for Supabase SDK references in the emitted code
        if (
          chunk.code.includes("@supabase/supabase-js") ||
          chunk.code.includes("supabase-js") ||
          (chunk.code.includes("createClient") && chunk.code.includes("supabase"))
        ) {
          // More precise: look for actual supabase module markers
          const hasSupabaseImport =
            chunk.code.includes("@supabase/supabase-js") ||
            chunk.code.includes("@supabase/") ||
            // Rollup may inline the package — check for Supabase SDK internals
            chunk.code.includes("supabase-js/") ||
            (chunk.code.includes("X-Client-Info") && chunk.code.includes("supabase"));

          if (hasSupabaseImport) {
            violations.push(fileName);
          }
        }
      }

      if (violations.length > 0) {
        const fileList = violations.map((f) => `  • ${f}`).join("\n");
        this.error(
          `[no-supabase-gateway-proxy] VITE_SPINE_PROVIDER=gateway-proxy but ` +
            `@supabase/supabase-js was found in the bundle.\n\n` +
            `Violating chunks:\n${fileList}\n\n` +
            `The gateway-proxy build must not include the Supabase SDK. ` +
            `Ensure all Supabase imports are tree-shaken or conditionally excluded.`
        );
      }
    },
  };
}
