import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, ROLES_KEY } from './auth.decorators';
import { AuthUser, AuthUserRole } from './auth.types';

/**
 * Global guard: every route requires a bearer token unless marked @Public().
 * Role checks run only when @Roles() is present.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isPublic) {
      return (await super.canActivate(context)) as boolean;
    }

    // Public route: still resolve the caller when a token is attached (so
    // guest routes can read a signed-in user's data), but never block the
    // request when the token is missing or invalid.
    try {
      await super.canActivate(context);
    } catch {
      // Anonymous access to a public route is fine.
    }

    return true;
  }

  handleRequest<TUser = AuthUser>(
    err: unknown,
    user: TUser | false,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err instanceof Error
        ? err
        : new UnauthorizedException('برای این کار باید وارد شوید');
    }

    const required = this.reflector.getAllAndOverride<AuthUserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (required?.length) {
      const role = (user as unknown as AuthUser).role;
      if (!required.includes(role)) {
        throw new ForbiddenException('دسترسی کافی ندارید');
      }
    }

    return user;
  }
}
