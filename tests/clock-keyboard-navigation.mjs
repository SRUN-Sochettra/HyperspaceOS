import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.HYPERSPACE_URL || "http://127.0.0.1:5173/";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();
const pageErrors = [];
const consoleErrors = [];

page.on("pageerror", (error) => pageErrors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

const selectedIndex = async () => page.locator('.clock-tab[role="tab"][aria-selected="true"]').evaluate((tab) => {
  const tabs = [...document.querySelectorAll('.clock-tab[role="tab"]')];
  return tabs.indexOf(tab);
});

const assertTabState = async (expectedIndex) => {
  const tabs = page.locator('.clock-tab[role="tab"]');
  assert.equal(await tabs.count(), 3, "Clock must render exactly three tabs");
  assert.equal(await selectedIndex(), expectedIndex, `expected selected tab ${expectedIndex}`);
  assert.equal(await tabs.nth(expectedIndex).getAttribute("aria-selected"), "true");
  assert.equal(await tabs.nth(expectedIndex).getAttribute("tabindex"), "0");
  for (let index = 0; index < 3; index += 1) {
    if (index !== expectedIndex) {
      assert.equal(await tabs.nth(index).getAttribute("aria-selected"), "false");
      assert.equal(await tabs.nth(index).getAttribute("tabindex"), "-1");
    }
  }
  assert.equal(await page.evaluate(() => document.activeElement?.matches('.clock-tab[role="tab"]')), true);
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-selected")), "true");
};

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("hyperspace-onboarding-done", "true");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => window.HyperOS?.Registry?.all?.().length === 22, null, { timeout: 60_000 });
  await page.waitForSelector("#dock");

  await page.evaluate(() => window.HyperOS.Registry.launch("clock"));
  await page.waitForSelector('.hyper-window[data-window-id] .clock-tab[role="tab"]');
  await page.waitForFunction(() => window.HyperOS.WindowManager.getAllWindows().some((win) => win.appId === "clock" && win.app));

  const tabs = page.locator('.clock-tab[role="tab"]');
  assert.equal(await tabs.count(), 3);
  assert.equal(await selectedIndex(), 0);
  assert.equal(await tabs.nth(0).getAttribute("tabindex"), "0");
  assert.equal(await tabs.nth(1).getAttribute("tabindex"), "-1");
  assert.equal(await tabs.nth(2).getAttribute("tabindex"), "-1");

  await tabs.nth(0).focus();
  await page.keyboard.press("ArrowRight");
  await assertTabState(1);

  await page.keyboard.press("ArrowRight");
  await assertTabState(2);

  await page.keyboard.press("ArrowRight");
  await assertTabState(0);

  await page.keyboard.press("ArrowLeft");
  await assertTabState(2);

  await page.keyboard.press("ArrowLeft");
  await assertTabState(1);

  await page.keyboard.press("ArrowLeft");
  await assertTabState(0);

  await page.keyboard.press("Home");
  await assertTabState(0);

  await page.keyboard.press("End");
  await assertTabState(2);

  await page.keyboard.press("Shift+ArrowLeft");
  await assertTabState(2);
  await page.keyboard.press("Control+ArrowLeft");
  await assertTabState(2);
  await page.keyboard.press("Enter");
  await assertTabState(2);

  await tabs.nth(1).click();
  await assertTabState(1);

  await page.locator('.hyper-window[data-window-id] .traffic-btn.close[data-action="close"]').click();
  await page.waitForFunction(() => window.HyperOS.WindowManager.getAllWindows().filter((win) => win.appId === "clock").length === 0);
  await page.waitForFunction(() => document.querySelectorAll('.hyper-window[data-window-id]').length === 0);

  const managerCount = await page.evaluate(() => window.HyperOS.WindowManager.getAllWindows().length);
  const domCount = await page.locator('.hyper-window[data-window-id]').count();
  assert.equal(managerCount, 0, "WindowManager should be empty after Clock close");
  assert.equal(domCount, 0, "Clock window DOM should be removed after close");
  assert.deepEqual(pageErrors, [], "Clock navigation must not produce page errors");
  assert.deepEqual(consoleErrors, [], "Clock navigation must not produce console errors");

  console.log(JSON.stringify({
    tabs: 3,
    initialSelected: "world",
    arrowRight: "next and wrapped",
    arrowLeft: "previous and wrapped",
    home: "first",
    end: "last",
    click: "preserved",
    unrelatedKeys: "ignored",
    managerCount,
    domCount,
    consoleErrors,
    pageErrors,
  }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
