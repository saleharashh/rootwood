import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, JwtPayload } from './auth.types';
import { AUTH_COOKIE_NAME, getJwtSecret } from './jwt.config';

function fromAuthCookie(request: Request): string | null {
  const cookies = request.headers.cookie;
  if (!cookies) return null;
  for (const part of cookies.split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === AUTH_COOKIE_NAME) {
      return decodeURIComponent(value.join('='));
    }
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        fromAuthCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(config),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException(
        'نشست شما منقضی شده است؛ دوباره وارد شوید',
      );
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
