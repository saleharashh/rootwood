import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, Public, Roles } from '../auth/auth.decorators';
import { ContactService } from './contact.service';
import {
  ContactQueryDto,
  CreateContactDto,
  UpdateContactStatusDto,
} from './dto/contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  create(@Body() dto: CreateContactDto, @CurrentUser('id') userId?: string) {
    return this.contact.create(
      dto.name,
      dto.email,
      dto.phone,
      dto.subject,
      dto.message,
      userId,
    );
  }

  @Roles('ADMIN')
  @Get()
  list(@Query() query: ContactQueryDto) {
    return this.contact.list(query.status, query.page ?? 1, query.limit ?? 20);
  }

  @Roles('ADMIN')
  @Patch(':id/status')
  markStatus(@Param('id') id: string, @Body() dto: UpdateContactStatusDto) {
    return this.contact.markStatus(id, dto.status);
  }
}
