import { expect, test } from "@playwright/test";

test.describe("storefront", () => {
  test("home page presents the workshop and featured pieces", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/کرفتدرات/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "مبلمانی که",
    );
    await expect(
      page.getByRole("link", { name: "کرفتدرات" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("article").first()).toBeVisible();
    await expect(page.locator("main img").first()).toBeVisible();
  });

  test("visitors can search the catalog", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "جستجو", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "جستجوی محصولات" });
    await expect(dialog).toBeVisible();

    const input = dialog.getByRole("searchbox", {
      name: "جستجوی محصولات",
    });
    await input.fill("میز");
    await input.press("Enter");

    await expect(page).toHaveURL(/\/products\?search=/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "همه محصولات",
    );
    await expect(page.getByRole("article").first()).toBeVisible();
  });

  test("product page shows details and adds to a guest cart", async ({
    page,
  }) => {
    await page.goto("/products/persian-oak-dining-table");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "میز غذاخوری بلوط ایرانی",
    );

    await page
      .getByRole("button", { name: /به سبد خرید$/ })
      .click();
    await expect(page.getByText(/به سبد خرید اضافه شد/).first()).toBeVisible();

    const cartButton = page.getByRole("button", {
      name: /^سبد خرید،/,
    });
    await expect(cartButton).toHaveAttribute("aria-label", /1 کالا/);
    await cartButton.click();

    const cart = page.getByRole("dialog", { name: /سبد خرید/ });
    await expect(cart).toBeVisible();
    await expect(
      cart.getByText("میز غذاخوری بلوط ایرانی").first(),
    ).toBeVisible();

    await cart.getByRole("button", { name: "بستن" }).click();
    await expect(cart).toBeHidden();
  });

  test("blog index opens an article", async ({ page }) => {
    await page.goto("/blog");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "یادداشت‌های کارگاه",
    );

    const articleLink = page.locator('a[href^="/blog/"]').first();
    await expect(articleLink).toBeVisible();
    await articleLink.click();

    await expect(page).toHaveURL(/\/blog\/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
