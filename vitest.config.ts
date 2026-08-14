import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ["browser"]
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov", "html"],
      reportsDirectory: "coverage",
      include: ["src/**/*.{ts,svelte}"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  }
});
