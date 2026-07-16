import path from "node:path";
import { chromium, type Locator, type Page } from "playwright";
import {
  ENTRY,
  FORM_URL,
  HARBOURMASTERS_YES_LABEL,
  LABELS,
} from "./form-map.js";
import type { Submission } from "./schema.js";

async function waitForFormReady(
  page: Page,
  timeoutMs: number,
): Promise<boolean> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await formLooksReady(page)) {
      return true;
    }
    await page.waitForTimeout(2_000);
    if (!page.isClosed()) {
      await page.goto(FORM_URL, { waitUntil: "domcontentloaded" }).catch(() => {});
    }
  }
  return false;
}

async function waitForBrowserToClose(page: Page): Promise<void> {
  while (!page.isClosed()) {
    try {
      await page.waitForTimeout(2_000);
    } catch {
      // Browser/context already closed by the user.
      return;
    }
  }
}

function questionByEntry(page: Page, entryId: string): Locator {
  return page
    .locator(
      `[data-item-id="${entryId}"], div[data-params*="${entryId}"], div[jsname][data-params*="${entryId}"]`,
    )
    .first();
}

function questionByHeading(page: Page, label: RegExp): Locator {
  return page
    .locator('div[role="listitem"]')
    .filter({ has: page.getByRole("heading", { name: label }) })
    .first();
}

async function resolveQuestion(
  page: Page,
  entryId: string,
  label: RegExp,
): Promise<Locator> {
  const byEntry = questionByEntry(page, entryId);
  if ((await byEntry.count()) > 0) {
    return byEntry;
  }
  const byHeading = questionByHeading(page, label);
  await byHeading.waitFor({ state: "visible", timeout: 30_000 });
  return byHeading;
}

async function fillText(
  page: Page,
  entryId: string,
  label: RegExp,
  value: string,
): Promise<void> {
  const q = await resolveQuestion(page, entryId, label);
  await q.waitFor({ state: "visible", timeout: 30_000 });
  const textbox = q.getByRole("textbox").first();
  await textbox.click();
  await textbox.fill(value);
}

async function fillEmail(page: Page, value: string): Promise<void> {
  const labeledEmailBox = page.getByRole("textbox", { name: LABELS.email }).first();
  if ((await labeledEmailBox.count()) > 0) {
    await labeledEmailBox.waitFor({ state: "visible", timeout: 30_000 });
    await labeledEmailBox.click();
    await labeledEmailBox.fill(value);
    return;
  }

  const firstTextbox = page.getByRole("textbox").first();
  await firstTextbox.waitFor({ state: "visible", timeout: 30_000 });
  await firstTextbox.click();
  await firstTextbox.fill(value);
}

async function checkHarbourmastersYes(page: Page): Promise<void> {
  const q = await resolveQuestion(
    page,
    ENTRY.harbourmastersYes,
    LABELS.harbourmastersProgram,
  );
  await q.waitFor({ state: "visible", timeout: 30_000 });
  const option = q.getByRole("checkbox", { name: HARBOURMASTERS_YES_LABEL });
  if (!(await option.isChecked())) {
    await option.check();
  }
}

async function selectMultipleChoice(
  page: Page,
  entryId: string,
  label: RegExp,
  choice: string,
): Promise<void> {
  const q = await resolveQuestion(page, entryId, label);
  await q.waitFor({ state: "visible", timeout: 30_000 });
  await q.getByRole("radio", { name: choice, exact: true }).check();
}

async function fillDate(
  page: Page,
  entryId: string,
  label: RegExp,
  isoDate: string,
): Promise<void> {
  const [year, month, day] = isoDate.split("-");
  const q = await resolveQuestion(page, entryId, label);
  await q.waitFor({ state: "visible", timeout: 30_000 });

  const dateInput = q.locator('input[type="date"]').first();
  if ((await dateInput.count()) > 0) {
    await dateInput.fill(isoDate);
    return;
  }

  const monthBox = q.getByLabel(/^month$/i).or(q.getByPlaceholder(/mm/i)).first();
  const dayBox = q.getByLabel(/^day$/i).or(q.getByPlaceholder(/dd/i)).first();
  const yearBox = q.getByLabel(/^year$/i).or(q.getByPlaceholder(/yyyy/i)).first();

  if (
    (await monthBox.count()) > 0 &&
    (await dayBox.count()) > 0 &&
    (await yearBox.count()) > 0
  ) {
    await monthBox.fill(month!);
    await dayBox.fill(day!);
    await yearBox.fill(year!);
    return;
  }

  const textboxes = q.getByRole("textbox");
  const n = await textboxes.count();
  if (n >= 3) {
    await textboxes.nth(0).fill(month!);
    await textboxes.nth(1).fill(day!);
    await textboxes.nth(2).fill(year!);
    return;
  }

  throw new Error(`Could not find date inputs for entry ${entryId}`);
}

async function fillTime(
  page: Page,
  entryId: string,
  label: RegExp,
  hhmm: string,
): Promise<void> {
  const [hour24Str, minute] = hhmm.split(":");
  const hour24 = Number(hour24Str);
  const q = await resolveQuestion(page, entryId, label);
  await q.waitFor({ state: "visible", timeout: 30_000 });

  const timeInput = q.locator('input[type="time"]').first();
  if ((await timeInput.count()) > 0) {
    await timeInput.fill(hhmm);
    return;
  }

  const hourBox = q.getByLabel(/^hour$/i).first();
  const minuteBox = q.getByLabel(/^minute$/i).first();
  if ((await hourBox.count()) > 0 && (await minuteBox.count()) > 0) {
    const isPm = hour24 >= 12;
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    await hourBox.fill(String(hour12).padStart(2, "0"));
    await minuteBox.fill(minute!);

    const amPmGroup = q.locator('[role="listbox"], [aria-label*="AM"], [aria-label*="PM"]').first();
    if ((await amPmGroup.count()) > 0) {
      await amPmGroup.click();
      await page
        .locator(`[role="option"][data-value="${isPm ? "PM" : "AM"}"]`)
        .filter({ visible: true })
        .first()
        .click();
    } else {
      const toggle = q.getByText(isPm ? /^PM$/i : /^AM$/i).first();
      if ((await toggle.count()) > 0) {
        await toggle.click();
      }
    }
    return;
  }

  const textboxes = q.getByRole("textbox");
  const n = await textboxes.count();
  if (n >= 2) {
    await textboxes.nth(0).fill(hour24Str!);
    await textboxes.nth(1).fill(minute!);
    return;
  }

  throw new Error(`Could not find time inputs for entry ${entryId}`);
}

async function isPage2Visible(page: Page): Promise<boolean> {
  const candidates = [
    page.getByRole("heading", { name: LABELS.eventName }),
    page.getByRole("heading", { name: LABELS.nameOfEvent }),
    page.getByRole("heading", { name: LABELS.cityState }),
  ];

  for (const locator of candidates) {
    if ((await locator.count()) > 0) {
      return true;
    }
  }
  return false;
}

async function waitForPage2(page: Page): Promise<void> {
  const nextButton = page.getByRole("button", { name: /^next$/i });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await isPage2Visible(page)) {
      return;
    }

    await nextButton.scrollIntoViewIfNeeded().catch(() => {});
    await nextButton.click();
    await page.waitForTimeout(2_000);
  }

  if (await isPage2Visible(page)) {
    return;
  }

  const headings = await page
    .getByRole("heading")
    .allInnerTexts()
    .catch(() => []);
  throw new Error(
    `Form did not advance to page 2 after clicking Next. Visible headings: ${headings.join(" | ")}`,
  );
}

async function formLooksReady(page: Page): Promise<boolean> {
  try {
    const q = await resolveQuestion(
      page,
      ENTRY.harbourmasterName,
      LABELS.harbourmasterName,
    );
    const box = q.getByRole("textbox").first();
    await box.waitFor({ state: "visible", timeout: 5_000 });
    return await box.isEditable();
  } catch {
    return false;
  }
}

async function fillPage1(page: Page, data: Submission): Promise<void> {
  await fillEmail(page, data.email);
  if (data.signedUpForHarbourmasters) {
    await checkHarbourmastersYes(page);
  }
  await fillText(
    page,
    ENTRY.harbourmasterName,
    LABELS.harbourmasterName,
    data.harbourmasterName,
  );
  await fillText(
    page,
    ENTRY.publicContact,
    LABELS.publicContact,
    data.publicContact,
  );
  await waitForPage2(page);
}

async function fillPage2(page: Page, data: Submission): Promise<void> {
  await fillText(page, ENTRY.eventName, LABELS.eventName, data.eventName);
  await fillText(page, ENTRY.cityState, LABELS.cityState, data.cityState);
  await fillText(
    page,
    ENTRY.nameOfEvent,
    LABELS.nameOfEvent,
    data.nameOfEvent,
  );
  await selectMultipleChoice(
    page,
    ENTRY.format,
    LABELS.format,
    data.format,
  );
  await fillText(
    page,
    ENTRY.maxPlayers,
    LABELS.maxPlayers,
    String(data.maxPlayers),
  );
  await fillText(
    page,
    ENTRY.addressOrLink,
    LABELS.addressOrLink,
    data.addressOrLink,
  );
  await fillDate(page, ENTRY.date, LABELS.date, data.date);
  await fillTime(page, ENTRY.startTime, LABELS.startTime, data.startTime);
  if (data.endTime) {
    await fillTime(page, ENTRY.endTime, LABELS.endTime, data.endTime);
  }
  await fillText(page, ENTRY.timezone, LABELS.timezone, data.timezone!);
  await fillText(
    page,
    ENTRY.description,
    LABELS.description,
    data.description,
  );
  if (data.notes) {
    await fillText(page, ENTRY.notes, LABELS.notes, data.notes);
  }
}

export async function fillForm(options: {
  data: Submission;
  profileDir: string;
  /** When true, fail fast instead of waiting for user/browser interaction. */
  nonInteractive?: boolean;
}): Promise<void> {
  const userDataDir = path.resolve(options.profileDir);
  // Use installed Google Chrome (not Playwright Chromium). Google blocks
  // sign-in in automated Chromium with "This browser or app may not be secure."
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chrome",
    headless: false,
    viewport: { width: 1100, height: 900 },
    ignoreDefaultArgs: ["--enable-automation"],
    args: ["--disable-blink-features=AutomationControlled"],
  });

  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(FORM_URL, { waitUntil: "domcontentloaded" });

    if (!(await formLooksReady(page))) {
      if (options.nonInteractive) {
        throw new Error(
          "Form requires Google sign-in. Run `npm run submit -- examples/sample-event.yaml` once, sign in, then re-run verify.",
        );
      }
      console.log(
        "Sign in to Google in the browser window. The script will continue automatically once the form is editable.",
      );
      const ready = await waitForFormReady(page, 10 * 60_000);
      if (!ready) {
        throw new Error(
          "Form fields did not become editable within 10 minutes. Sign in and re-run.",
        );
      }
    }

    await fillPage1(page, options.data);
    await fillPage2(page, options.data);

    console.log(
      "Form filled. Review in the browser and click Submit when ready. Close the browser window when you are done.",
    );
    if (!options.nonInteractive) {
      await waitForBrowserToClose(page);
    }
  } finally {
    await context.close().catch(() => {});
  }
}
