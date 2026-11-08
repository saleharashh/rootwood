export function assertTestDatabaseUrl(connectionString: string): string {
  const url = new URL(connectionString);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!database.endsWith('_test')) {
    throw new Error(
      `Refusing to run destructive test setup against "${database}": database name must end with _test`,
    );
  }
  return connectionString;
}

export function getTestDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) {
    return assertTestDatabaseUrl(process.env.TEST_DATABASE_URL);
  }

  const base = process.env.DATABASE_URL;
  if (!base) {
    throw new Error(
      'Set TEST_DATABASE_URL or DATABASE_URL before preparing the test database',
    );
  }

  const url = new URL(base);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!database) throw new Error('DATABASE_URL must include a database name');

  if (!database.endsWith('_test')) {
    url.pathname = `/${database}_test`;
  }
  return assertTestDatabaseUrl(url.toString());
}

export function getTestDatabaseName(connectionString: string): string {
  return decodeURIComponent(
    new URL(connectionString).pathname.replace(/^\//, ''),
  );
}
