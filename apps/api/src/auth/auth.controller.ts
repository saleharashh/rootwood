import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser, Public } from './auth.decorators';
import { AuthService } from './auth.service';
import { AUTH_COOKIE_NAME } from './jwt.config';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  SendOtpDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('otp/send')
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.auth.sendOtp(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('otp/verify')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.verifyOtp(dto);
    this.setAuthCookie(response, result.accessToken);
    return { user: result.user };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.register(dto);
    this.setAuthCookie(response, result.accessToken);
    return { user: result.user };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto);
    this.setAuthCookie(response, result.accessToken);
    return { user: result.user };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @CurrentUser('id') userId: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(userId);
    response.clearCookie(AUTH_COOKIE_NAME, this.cookieOptions());
    return { success: true };
  }

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.auth.me(userId);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.auth.updateProfile(userId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.changePassword(userId, dto);
    this.setAuthCookie(response, result.accessToken);
    return { success: true, user: result.user };
  }

  private setAuthCookie(response: Response, token: string) {
    response.cookie(AUTH_COOKIE_NAME, token, {
      ...this.cookieOptions(),
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  private cookieOptions() {
    const configuredSameSite = (
      this.config.get<string>('AUTH_COOKIE_SAME_SITE') ?? 'lax'
    ).toLowerCase();
    const sameSite = ['lax', 'strict', 'none'].includes(configuredSameSite)
      ? (configuredSameSite as 'lax' | 'strict' | 'none')
      : 'lax';
    const secureSetting = this.config.get<string>('AUTH_COOKIE_SECURE');
    const secure =
      sameSite === 'none' ||
      (secureSetting
        ? secureSetting === 'true'
        : this.config.get<string>('NODE_ENV') === 'production');
    const domain = this.config.get<string>('AUTH_COOKIE_DOMAIN')?.trim();

    return {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }
}
