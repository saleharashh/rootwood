import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { signInThroughApi, waitForPageReady } from "./helpers";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoA11yViolations(page: Page) {
  await waitForPageReady(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  const violations = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }));

  expect(violations).toEqual([]);
}

test.describe("accessibility", () => {
  const publicPages = [
    "/",
    "/products",
    "/products/persian-oak-dining-table",
    "/blog",
    "/blog/choosing-the-right-wood-for-your-home",
    "/about",
    "/contact",
  ];

  for (const path of publicPages) {
    test(`public page ${path} has no WCAG A/AA violations`, async ({
      page,
    }) => {
      await page.goto(path);
      await expectNoA11yViolations(page);
    });
  }

  test("sign-in dialog has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "ورود", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: /ورود به کرفتدرات/ }),
    ).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("admin dashboard has no WCAG A/AA violations", async ({ page }) => {
    await signInThroughApi(page.request);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { level: 1, name: "داشبورد کارگاه" }),
    ).toBeVisible();
    await expectNoA11yViolations(page);
  });
});
