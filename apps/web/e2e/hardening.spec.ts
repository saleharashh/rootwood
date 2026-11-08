import { expect, test } from "@playwright/test";
import { API_URL } from "./test-env";

test.describe("deployment hardening", () => {
  test("storefront sends security headers and hides its framework", async ({
    request,
  }) => {
    const response = await request.get("/");
    expect(response.ok()).toBe(true);

    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("API health reports a live database", async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.checks.database).toBe("up");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("robots and sitemap protect the admin area", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).toContain("<urlset");
  });
});
