import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "lib/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@/lib/supabase/server": path.resolve(dir, "lib/supabase/server.ts"),
    },
  },
});
