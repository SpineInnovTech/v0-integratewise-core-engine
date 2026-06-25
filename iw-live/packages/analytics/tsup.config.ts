import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "providers/posthog": "src/providers/posthog.ts",
    "providers/mixpanel": "src/providers/mixpanel.ts",
    "providers/amplitude": "src/providers/amplitude.ts",
    "providers/console": "src/providers/console.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "posthog-js", "mixpanel-browser", "@amplitude/analytics-browser"],
});
