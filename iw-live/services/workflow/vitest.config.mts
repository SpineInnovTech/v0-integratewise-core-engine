import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "path";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "cloudflare:workers": path.resolve(dirname, "../../vitest-stubs/cloudflare-workers.ts"),
    },
  },
});
