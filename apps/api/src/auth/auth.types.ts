export type AuthUserRole = 'CUSTOMER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  role: AuthUserRole;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: AuthUserRole;
  tokenVersion: number;
}
