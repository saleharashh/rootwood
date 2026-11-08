import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { ADMIN_EMAIL, API_URL, DEMO_PASSWORD } from "./test-env";

export async function signInThroughUi(
  page: Page,
  email = ADMIN_EMAIL,
  password = DEMO_PASSWORD,
) {
  await page.goto("/");
  await page.getByRole("button", { name: "ورود", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /ورود به کرفتدرات/ });
  await expect(dialog).toBeVisible();
  const passwordTab = dialog.getByRole("tab", { name: /گذرواژه/ });
  if (await passwordTab.isVisible()) {
    await passwordTab.click();
  }
  await dialog.getByLabel("نشانی ایمیل").fill(email);
  await dialog.getByLabel("گذرواژه", { exact: true }).fill(password);
  await dialog.getByRole("button", { name: "ورود", exact: true }).click();
  await expect(dialog).toBeHidden();
}

export async function signInThroughApi(
  request: APIRequestContext,
  email = ADMIN_EMAIL,
  password = DEMO_PASSWORD,
) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });
  expect(
    response.ok(),
    `API sign-in failed with ${response.status()}: ${await response.text()}`,
  ).toBe(true);
}

interface PageReadyOptions {
  scrollThrough?: boolean;
}

export async function waitForPageReady(
  page: Page,
  { scrollThrough = false }: PageReadyOptions = {},
) {
  await page.waitForLoadState("networkidle");

  if (scrollThrough) {
    await page.evaluate(async () => {
      const root = document.documentElement;
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";

      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      window.scrollTo(0, 0);
      root.style.scrollBehavior = previousBehavior;
    });
    await page.waitForTimeout(150);
  }

  await page.evaluate(async () => {
    await document.fonts.ready;
    const pendingImages = Promise.all(
      Array.from(document.images)
        .filter((image) => !image.complete)
        .map(
          (image) =>
            new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            }),
        ),
    );
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000));
    await Promise.race([pendingImages, timeout]);
  });
}
