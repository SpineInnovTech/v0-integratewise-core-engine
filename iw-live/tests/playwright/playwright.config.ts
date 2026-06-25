import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./suites",
  timeout: 60_000,
  retries: 0, // RC1 = zero flaky tolerance
  use: {
    baseURL: process.env.BASE_URL || "https://gateway.dev.integratewise.ai",
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  },
  projects: [
    { name: "api", testMatch: /.*\.api\.ts/ },
    { name: "ui", testMatch: /.*\.ui\.ts/, use: { browserName: "chromium" } },
  ],
});
