import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { PlaywrightTestConfig } from "@playwright/test";

const API_DIR = path.resolve(__dirname, "../../api");
const WEB_DIR = path.resolve(__dirname, "..");

function loadEnvFile(file: string) {
  if (!existsSync(file)) return;
  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(path.join(API_DIR, ".env"));

export const API_PORT = Number(process.env.E2E_API_PORT ?? 3101);
export const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3100);
export const API_URL = `http://127.0.0.1:${API_PORT}`;
export const WEB_URL = `http://127.0.0.1:${WEB_PORT}`;
export const ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ?? "hello@craftedroot.com";
export const DEMO_PASSWORD =
  process.env.SEED_DEMO_PASSWORD ?? "CraftedRoot!2026";
export const SCREENSHOT_DIR = path.resolve(__dirname, "../../../docs/screenshots");

function resolveTestDatabaseUrl(): string {
  const explicit = process.env.TEST_DATABASE_URL;
  if (explicit) {
    const url = new URL(explicit);
    const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
    if (!database.endsWith("_test")) {
      throw new Error(
        "TEST_DATABASE_URL must point to a database whose name ends with _test",
      );
    }
    return url.toString();
  }

  const base = process.env.DATABASE_URL;
  if (!base) {
    throw new Error(
      "Set TEST_DATABASE_URL or DATABASE_URL (apps/api/.env) before running the Playwright suite.",
    );
  }
  const url = new URL(base);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database) throw new Error("DATABASE_URL must include a database name");
  if (!database.endsWith("_test")) url.pathname = `/${database}_test`;
  return url.toString();
}

function inheritedEnv(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

export function apiServerEnv(): Record<string, string> {
  return {
    ...inheritedEnv(),
    DATABASE_URL: resolveTestDatabaseUrl(),
    NODE_ENV: "test",
    PORT: String(API_PORT),
    JWT_SECRET:
      process.env.JWT_SECRET ??
      "craftedroot-e2e-secret-at-least-32-chars-long",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d",
    SEED_DEMO_PASSWORD: DEMO_PASSWORD,
    CORS_ORIGINS: `${WEB_URL},http://localhost:${WEB_PORT}`,
    AUTH_COOKIE_SECURE: "false",
    AUTH_COOKIE_SAME_SITE: "lax",
  };
}

export function webServerEnv(): Record<string, string> {
  return {
    ...inheritedEnv(),
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_DISABLE_DEV_INDICATOR: "true",
    API_URL,
    API_PROXY_TARGET: API_URL,
    NEXT_PUBLIC_API_URL: API_URL,
    NEXT_PUBLIC_SITE_URL: WEB_URL,
  };
}

export function createWebServers(): NonNullable<
  PlaywrightTestConfig["webServer"]
> {
  return [
    {
      command: "pnpm build && node dist/src/main.js",
      cwd: API_DIR,
      url: `${API_URL}/health`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: apiServerEnv(),
    },
    {
      command: `pnpm exec next dev -p ${WEB_PORT} -H 127.0.0.1`,
      cwd: WEB_DIR,
      url: WEB_URL,
      reuseExistingServer: false,
      timeout: 240_000,
      env: webServerEnv(),
    },
  ];
}
