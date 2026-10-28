import { defineConfig } from "@playwright/test";

// Without E2E_BASE_URL the app is started locally (or an already running dev server is reused).
const externalBaseUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: externalBaseUrl ?? "http://localhost:3000",
    channel: "chrome", // the installed Google Chrome; alternative: npx playwright install chromium
    trace: "off",
    screenshot: "only-on-failure",
  },
  webServer: externalBaseUrl
    ? undefined
    : { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "public", testMatch: "public.spec.ts" },
    { name: "signed-in", testMatch: "app.spec.ts", use: { storageState: "e2e/.auth/state.json" } },
  ],
});
