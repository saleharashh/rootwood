import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getIndex() {
    return {
      service: 'craftedroot-api',
      version: '1.0.0',
    };
  }

  @Public()
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
