import { resolve } from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  // e2e/ holds the Playwright tests, which have their own runner (npm run test:e2e).
  test: { exclude: [...configDefaults.exclude, "e2e/**"] },
});
