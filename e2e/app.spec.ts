import { expect, test, type Locator, type Page } from "@playwright/test";

// Signed-in screens, driven with a real session for a throwaway user (see global-setup.ts).
// One serial flow: the steps share the user, the Notebook and one browser page (the chat lives in page state).
test.describe.configure({ mode: "serial" });

const SOURCE_TITLE = "Zorblax method";
const NOTE_TITLE = "Zorblax workshop plan";
const NOTE_RENAMED = "Zorblax renamed";
const NOTE_BODY = "Remember the Quonk review and the Glimmer round.";
const MODEL_WAIT = 90_000;

// A fictional method, so answers can be checked against content a model cannot know.
const ZORBLAX_TEXT = `The Zorblax method is a way to organise workshops in five steps. It was invented by the facilitator Mirelda Quopp for teams that lose time in long meetings.

Step one is called Glimmer. In the Glimmer round every participant writes one hopeful sentence about the workshop goal on a yellow card, and the cards are read out loud without comment. Glimmer takes ten minutes.

Step two is called Tumblewick. The group sorts all cards into piles on the floor, and every pile gets a nickname such as "the wobbling bridge". Tumblewick takes fifteen minutes and must be done standing up.

Step three is called Quonk. In the Quonk review a person who did not take part in Tumblewick walks around the piles and asks exactly three questions. The facilitator may not answer them. Quonk takes twenty minutes.

Step four is called Frizzle. The group chooses one pile and turns it into a plan with a named owner, a date and a first small action. Frizzle takes thirty minutes, and the owner is chosen by a coin toss to avoid long discussions.

Step five is called Nebbin. The group closes with a Nebbin circle: each participant names one thing they will stop doing. The last speaker rings a small brass bell. Nebbin takes ten minutes.

The whole Zorblax method needs about ninety minutes, one room with a free floor, yellow cards, markers and a brass bell. Mirelda Quopp says it works best for groups of six to twelve people, and that the bell is not optional.`;

// ---- helpers: every selector of this file lives here -------------------------------------------

const header = (page: Page) => page.getByRole("banner");
const addSourcesDialog = (page: Page) => page.getByRole("dialog", { name: "Add sources" });
const sourceCheckbox = (page: Page, title: string) => page.getByRole("checkbox", { name: `Use ${title} for chat` });
const copyAnswerButton = (article: Locator) => article.getByRole("button", { name: "Copy answer" });
const noteTitleInput = (page: Page) => page.getByRole("textbox", { name: "Note title" });
const noteTextInput = (page: Page) => page.getByRole("textbox", { name: "Note text" });
const noteListEntry = (page: Page, title: string) => page.getByRole("button", { name: title, exact: true });
// The guide is the first article of the chat column, each question and answer after it is one more.
const chatArticle = (page: Page, index: number) => page.locator("article").nth(index);
// Question cards are the buttons without an accessible label and not grayed out.
const cards = (article: Locator) => article.locator("button:not([aria-disabled='true']):not([aria-label])");

async function openAddSources(page: Page) {
  await page.getByRole("button", { name: "Add sources", exact: true }).click();
  await expect(addSourcesDialog(page)).toBeVisible();
  return addSourcesDialog(page);
}

async function closeAddSources(page: Page) {
  await addSourcesDialog(page).getByRole("button", { name: "Close", exact: true }).click();
  await expect(addSourcesDialog(page)).toBeHidden();
}

async function waitUntilReady(page: Page, title: string) {
  await expect(sourceCheckbox(page, title)).toBeEnabled({ timeout: MODEL_WAIT });
}

async function openNoteMenu(page: Page, title: string, item: string) {
  await page.getByRole("button", { name: `Actions for ${title}` }).click();
  await page.getByRole("button", { name: item, exact: true }).click();
}

// Autosave: blur saves at once, the debounce covers the rest; give both a moment to reach the database.
const letSaveFinish = (page: Page) => page.waitForTimeout(2000);

// ---- the flow ------------------------------------------------------------------------------------

let page: Page;

test.beforeAll(async ({ browser }) => {
  const baseURL = test.info().project.use.baseURL;
  const context = await browser.newContext({ baseURL, storageState: "e2e/.auth/state.json" });
  page = await context.newPage();
});

test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await testInfo.attach("page", { body: await page.screenshot(), contentType: "image/png" });
  }
});

test.afterAll(async () => {
  await page?.context().close();
});

test("a: empty state", async () => {
  await page.goto("/");
  await expect(header(page).getByText("Untitled notebook")).toBeVisible();
  await expect(page.getByText("Saved sources will appear here")).toBeVisible();
});

test("b: add pasted text and wait until it is ready", async () => {
  const dialog = await openAddSources(page);
  await dialog.getByRole("button", { name: "Copied text" }).click();
  await dialog.getByPlaceholder("Title").fill(SOURCE_TITLE);
  await dialog.getByPlaceholder("Paste text here").fill(ZORBLAX_TEXT);
  await dialog.getByRole("button", { name: "Insert" }).click();

  await expect(addSourcesDialog(page)).toBeHidden();
  await expect(page.getByText(SOURCE_TITLE, { exact: true })).toBeVisible();
  await waitUntilReady(page, SOURCE_TITLE);
  await expect(sourceCheckbox(page, SOURCE_TITLE)).toBeChecked();
});

test("c: the guide gives a title, a summary and three question cards", async () => {
  // "Creating summary..." may flash first; the guide is ready when its title replaces the placeholder.
  await expect(header(page).getByText("Untitled notebook")).toBeHidden({ timeout: MODEL_WAIT });
  const guide = chatArticle(page, 0);
  await expect(guide.getByRole("button", { name: "Copy summary" })).toBeVisible({ timeout: MODEL_WAIT });
  await expect(guide.getByRole("heading", { level: 2 })).toHaveText(/\S/);
  await expect(guide.locator("p").nth(1)).toHaveText(/[\s\S]{80,}/); // the summary paragraph
  await expect(cards(guide)).toHaveCount(3);
});

test("d: a question card streams an answer with citations", async () => {
  const guide = chatArticle(page, 0);
  const card = cards(guide).first();
  const question = ((await card.innerText()) ?? "").trim();
  expect(question.length).toBeGreaterThan(5);
  await card.click();

  const turn = chatArticle(page, 1);
  await expect(turn.getByRole("heading", { level: 2 })).toHaveText(question);
  await expect(turn.locator("p").nth(1)).toHaveText(/\S{3,}/, { timeout: MODEL_WAIT }); // streaming started
  await expect(copyAnswerButton(turn)).toBeVisible({ timeout: MODEL_WAIT }); // streaming finished

  const markers = turn.locator("sup").filter({ hasText: /^\d+$/ });
  await expect(markers.first()).toBeVisible();
  await markers.first().hover();
  await expect(page.getByRole("tooltip").filter({ hasText: SOURCE_TITLE })).toBeVisible();

  // Follow-up cards are a soft check: the model may skip them.
  await expect.soft(cards(turn)).toHaveCount(3);
});

test("e: a typed use-case question is answered from the source", async () => {
  await page.getByPlaceholder("Ask a question or create something").fill("How would the Zorblax method apply to a small bakery?");
  await page.getByRole("button", { name: "Send" }).click();

  const turn = chatArticle(page, 2);
  await expect(turn.locator("p").nth(1)).toHaveText(/\S{3,}/, { timeout: MODEL_WAIT });
  await expect(copyAnswerButton(turn)).toBeVisible({ timeout: MODEL_WAIT });
  const answer = await turn.locator("p").nth(1).innerText();
  expect(answer.trim().length).toBeGreaterThan(20);
  expect.soft(answer).not.toMatch(/do(es)? not (know|mention)|no information/i);

  // The question is a small bubble, not a page heading.
  const fontSize = await turn.getByRole("heading", { level: 2 }).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(fontSize).toBeLessThanOrEqual(20);
});

test("f: upload a .md file, reject a .docx", async () => {
  let dialog = await openAddSources(page);
  await dialog.locator("input[type=file]").setInputFiles("e2e/fixtures/checklist.md");
  await expect(addSourcesDialog(page)).toBeHidden();
  await waitUntilReady(page, "checklist.md");

  dialog = await openAddSources(page);
  await dialog.locator("input[type=file]").setInputFiles({
    name: "report.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: Buffer.from("PK\u0003\u0004 not a real document"),
  });
  await expect(dialog.getByText(/Unsupported file type/)).toBeVisible();
  await closeAddSources(page);
  await expect(page.getByText("report.docx")).toHaveCount(0);
});

test("g: notes can be created, saved, renamed and removed", async () => {
  await page.getByRole("button", { name: "Create note", exact: true }).click();

  // The editor opens in the right panel: breadcrumb, inert toolbar, title and text fields.
  await expect(page.getByText(/Studio\W*Note\b/).first()).toBeVisible();
  for (const name of ["undo", "redo", "bold", "italic", "Text style"]) {
    const button = page.getByRole("button", { name, exact: true });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("aria-disabled", "true");
  }

  await noteTitleInput(page).fill(NOTE_TITLE);
  await noteTextInput(page).fill(NOTE_BODY);
  await noteTextInput(page).blur();
  await letSaveFinish(page);

  await page.reload();
  await expect(noteListEntry(page, NOTE_TITLE)).toBeVisible();
  await noteListEntry(page, NOTE_TITLE).click();
  await expect(noteTitleInput(page)).toHaveValue(NOTE_TITLE);
  await expect(noteTextInput(page)).toHaveValue(NOTE_BODY);

  // Rename through the three-dot menu: the title input that appears is the focused one.
  await openNoteMenu(page, NOTE_TITLE, "Rename note");
  await expect(page.locator("input:focus")).toBeVisible();
  await page.locator("input:focus").fill(NOTE_RENAMED);
  await page.keyboard.press("Enter");
  await expect(noteListEntry(page, NOTE_RENAMED)).toBeVisible();
  await expect(noteListEntry(page, NOTE_TITLE)).toHaveCount(0);

  // Remove with the trash button in the editor; the editor closes and the list entry goes.
  await page.getByRole("button", { name: "Remove note", exact: true }).click();
  await expect(noteTextInput(page)).toBeHidden();
  await expect(noteListEntry(page, NOTE_RENAMED)).toHaveCount(0);
});

test("h: the right panel folds in and out", async () => {
  await page.getByRole("button", { name: "Collapse panel", exact: true }).click();
  await expect(page.getByRole("button", { name: "Expand panel", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Studio" })).toBeHidden();

  await page.getByRole("button", { name: "Expand panel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Studio" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Collapse panel", exact: true })).toBeVisible();
});

test("i: the grayed-out Websites chip explains itself", async () => {
  const dialog = await openAddSources(page);
  await dialog.getByRole("button", { name: /Websites/ }).hover();
  await expect(page.getByRole("tooltip").filter({ hasText: "Not part of this clone's scope" })).toBeVisible();
  await closeAddSources(page);
});

test("j: signing out lands on the start page", async () => {
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL(/\/welcome$/);
});
