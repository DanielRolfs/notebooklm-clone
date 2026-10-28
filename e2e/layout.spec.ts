import { expect, test, type Page, type TestInfo } from "@playwright/test";

// Layout at different window widths (half screen, laptop, large). Needs no model calls: it only looks
// at the empty notebook and at an open note. It finds elements that stick out of their container and
// attaches a screenshot of every case, so a failure shows what the user would see.
const SIZES = [
  { width: 900, height: 800 },
  { width: 1100, height: 800 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

type Offender = { what: string; box: string; parent: string };

// Runs in the page. An element "overflows" when it is visible, in normal flow, and extends past the
// right or left edge of a parent that does not clip or scroll its content.
function findOverflow(): Offender[] {
  const found: Offender[] = [];
  const describe = (el: Element) => {
    const label = el.getAttribute("aria-label") || (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `<${el.tagName.toLowerCase()}> "${label}"`;
  };
  for (const el of Array.from(document.body.querySelectorAll("*"))) {
    if (el.closest("svg") || el.closest("[role='tooltip']")) continue;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.position === "fixed" || style.position === "absolute") continue;
    const parent = el.parentElement;
    if (!parent || parent === document.body) continue;
    const pStyle = getComputedStyle(parent);
    if (pStyle.overflowX !== "visible" || pStyle.display === "contents") continue;
    const r = el.getBoundingClientRect();
    const p = parent.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || p.width === 0) continue;
    if (r.right > p.right + 1.5 || r.left < p.left - 1.5) {
      found.push({
        what: describe(el),
        box: `${Math.round(r.left)}-${Math.round(r.right)} (w ${Math.round(r.width)})`,
        parent: `${describe(parent)} ${Math.round(p.left)}-${Math.round(p.right)}`,
      });
    }
  }
  return found.slice(0, 25);
}

async function checkLayout(page: Page, testInfo: TestInfo, name: string) {
  const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const offenders = await page.evaluate(findOverflow);
  const shot = await page.screenshot();
  await testInfo.attach(name, { body: shot, contentType: "image/png" });
  // Optional: E2E_SHOTS_DIR=some/folder also writes every screenshot there (attachments of passing tests are not kept).
  if (process.env.E2E_SHOTS_DIR) {
    const { mkdirSync, writeFileSync } = await import("node:fs");
    mkdirSync(process.env.E2E_SHOTS_DIR, { recursive: true });
    writeFileSync(`${process.env.E2E_SHOTS_DIR}/${name}.png`, shot);
  }
  const report = offenders.map((o) => `${o.what} ${o.box} sticks out of ${o.parent}`).join("\n");
  expect.soft(pageOverflow, `the page scrolls sideways by ${pageOverflow}px`).toBeLessThanOrEqual(1);
  expect.soft(offenders, `elements sticking out of their container:\n${report}`).toEqual([]);
}

for (const size of SIZES) {
  test(`layout holds at ${size.width}x${size.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Add sources", exact: true })).toBeVisible();
    await expect(page.getByText("Studio", { exact: true }).first()).toBeVisible();

    // Studio panel with its tiles (the default right panel).
    await checkLayout(page, testInfo, `studio-${size.width}`);

    // Open note in the right panel.
    await page.getByRole("button", { name: "Create note", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Note title" })).toBeVisible();
    await checkLayout(page, testInfo, `note-${size.width}`);
  });
}
