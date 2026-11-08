import { expect, test } from "@playwright/test";
import { signInThroughUi } from "./helpers";

test.describe("authentication and admin", () => {
  test("admin can inspect orders, reviews and tickets", async ({ page }) => {
    await signInThroughUi(page);
    await expect(page).toHaveURL(/\/account/);

    const adminLink = page.getByRole("link", { name: "پنل مدیریت" });
    await expect(adminLink).toBeVisible();
    await adminLink.click();

    await expect(page).toHaveURL(/\/admin/);
    await expect(
      page.getByRole("heading", { level: 1, name: "داشبورد کارگاه" }),
    ).toBeVisible();
    await expect(page.getByText("درآمد تأییدشده")).toBeVisible();

    await page.getByRole("tab", { name: /سفارش/ }).click();
    await expect(page.getByLabel("جستجوی سفارش")).toBeVisible();
    await page.getByLabel("جستجوی سفارش").fill("CR-DEMO-1046");
    await page.getByLabel("جستجوی سفارش").press("Enter");
    await expect(page.getByText("CR-DEMO-1046").first()).toBeVisible();

    await page.getByRole("tab", { name: /نظرات/ }).click();
    await expect(
      page.getByRole("button", { name: "تأیید و انتشار" }).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "تأییدشده", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "لغو انتشار" }).first(),
    ).toBeVisible();

    await page.getByRole("tab", { name: /پیام/ }).click();
    await expect(
      page.getByRole("button", { name: "جدید", exact: true }).first(),
    ).toBeVisible();
  });

  test("customers without the admin role are turned away", async ({ page }) => {
    await signInThroughUi(page, "nadia@example.com");
    await page.goto("/admin");

    await expect(
      page.getByRole("heading", { name: "این صفحه مخصوص مدیر کارگاه است" }),
    ).toBeVisible();
  });

  test("new customers can create an account", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;

    await page.goto("/");
    await page.getByRole("button", { name: "ورود", exact: true }).click();

    const signInDialog = page.getByRole("dialog", { name: /ورود به کرفتدرات/ });
    await signInDialog.getByRole("tab", { name: "ساخت حساب" }).click();

    const signUpDialog = page.getByRole("dialog", {
      name: /ساخت حساب کاربری/,
    });
    await signUpDialog.getByLabel("نام و نام خانوادگی").fill("E2E Tester");
    await signUpDialog.getByLabel("نشانی ایمیل").fill(email);
    await signUpDialog.getByLabel("گذرواژه", { exact: true }).fill("E2E-Password-2026");
    await signUpDialog
      .getByLabel("تکرار گذرواژه")
      .fill("E2E-Password-2026");
    await signUpDialog.getByRole("button", { name: "ساخت حساب" }).click();

    await expect(page).toHaveURL(/\/account/);
    await expect(
      page.getByRole("heading", { level: 1, name: "E2E Tester" }),
    ).toBeVisible();
  });
});
