import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../auth/auth.decorators';
import { BlogService } from './blog.service';
import { BlogQueryDto } from './dto/blog.dto';

@Controller('blog')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Public()
  @Get()
  list(@Query() query: BlogQueryDto) {
    return this.blog.list(
      query.page ?? 1,
      query.limit ?? 9,
      query.tag,
      query.q,
    );
  }

  @Public()
  @Get('tags')
  tags() {
    return this.blog.getTags();
  }

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.blog.getBySlug(slug);
  }
}
