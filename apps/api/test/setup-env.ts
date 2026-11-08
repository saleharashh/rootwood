import 'dotenv/config';
import { getTestDatabaseUrl } from './test-database';

process.env.DATABASE_URL = getTestDatabaseUrl();
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'craftedroot-e2e-secret-at-least-32-chars-long';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1d';
process.env.SEED_DEMO_PASSWORD =
  process.env.SEED_DEMO_PASSWORD ?? 'CraftedRoot!2026';
