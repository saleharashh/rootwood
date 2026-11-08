import { ConfigService } from '@nestjs/config';

export const AUTH_COOKIE_NAME = 'craftedroot_auth';

export function getJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET')?.trim();
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters');
  }
  return secret;
}
