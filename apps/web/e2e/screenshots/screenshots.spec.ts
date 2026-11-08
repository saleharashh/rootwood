import { mkdirSync } from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";
import { signInThroughUi, waitForPageReady } from "../helpers";
import { SCREENSHOT_DIR } from "../test-env";

test("capture portfolio screenshots", async ({ page }) => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });

  async function capture(name: string, url: string, fullPage = true) {
    await page.goto(url);
    await waitForPageReady(page, { scrollThrough: true });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${name}.jpg`),
      type: "jpeg",
      quality: 88,
      fullPage,
      animations: "disabled",
      caret: "hide",
    });
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture("01-home-desktop", "/");
  await capture("02-products", "/products");
  await capture("03-product-detail", "/products/persian-oak-dining-table");
  await capture("04-blog", "/blog");
  await capture("05-contact", "/contact");

  await signInThroughUi(page);
  await capture("06-admin-dashboard", "/admin");

  await page.setViewportSize({ width: 390, height: 844 });
  await capture("07-home-mobile", "/", false);
});
