import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/spine.ts", "src/webhooks.ts", "src/common.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
