import 'dotenv/config';
import { execSync } from 'node:child_process';
import { Client } from 'pg';
import { getTestDatabaseName, getTestDatabaseUrl } from './test-database';

async function ensureDatabase(connectionString: string) {
  const database = getTestDatabaseName(connectionString);
  const adminUrl = new URL(connectionString);
  adminUrl.pathname = '/postgres';
  adminUrl.search = '';

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const existing = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );
    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE "${database.replace(/"/g, '""')}"`);
      console.log(`[test-db] created ${database}`);
    }
  } finally {
    await client.end();
  }
}

async function main() {
  const testUrl = getTestDatabaseUrl();
  const database = getTestDatabaseName(testUrl);
  await ensureDatabase(testUrl);

  const env = {
    ...process.env,
    DATABASE_URL: testUrl,
    NODE_ENV: 'test',
    SEED_DEMO_PASSWORD: process.env.SEED_DEMO_PASSWORD ?? 'CraftedRoot!2026',
  };

  console.log(`[test-db] applying migrations to ${database}`);
  execSync('pnpm exec prisma migrate deploy', {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
  });

  console.log(`[test-db] seeding ${database}`);
  execSync('pnpm exec tsx prisma/seed.ts', {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
  });

  console.log(`[test-db] ready: ${database}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
