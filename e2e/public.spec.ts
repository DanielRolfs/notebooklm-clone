import { expect, test } from "@playwright/test";

// Logged-out checks: the public start page and the guards in front of everything else.

test.describe("start page", () => {
  test("loads with the headline and no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));

    const res = await page.goto("/welcome");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Simply\s*understand\s*everything/) // the words sit on separate lines, so no spaces in the text;
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });

  test("has no running animations and ten markers on the diagram", async ({ page }) => {
    await page.goto("/welcome");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await expect(page.locator("svg.flow-svg g[fill='#4fa0ff'] > *")).toHaveCount(10);
  });

  test("does not scroll sideways on a phone", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto("/welcome");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await context.close();
  });

  test("Sign in leads to Google (without logging in)", async ({ page }) => {
    await page.goto("/welcome");
    await page.getByRole("link", { name: "Sign in", exact: true }).first().click();
    await page.waitForURL(/accounts\.google\.com/);
  });
});

test.describe("access guards", () => {
  test("anonymous / lands on /welcome", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/welcome$/);
  });

  test("anonymous /login ends on Google", async ({ page }) => {
    await page.goto("/login");
    await page.waitForURL(/accounts\.google\.com/);
  });

  for (const path of ["/api/chat", "/api/sources", "/api/guide"]) {
    test(`POST ${path} without a session is refused`, async ({ request }) => {
      const res = await request.post(path, { maxRedirects: 0, data: {} });
      expect([307, 401]).toContain(res.status());
    });
  }
});
