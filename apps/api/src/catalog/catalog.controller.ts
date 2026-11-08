import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public, Roles } from '../auth/auth.decorators';
import { CatalogService } from './catalog.service';
import {
  CreateCategoryDto,
  CreateProductDto,
  ProductQueryDto,
  UpdateCategoryDto,
  UpdateProductDto,
} from './dto/catalog.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get('categories')
  listCategories() {
    return this.catalog.listCategories();
  }

  @Roles('ADMIN')
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Roles('ADMIN')
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalog.updateCategory(id, dto);
  }

  @Roles('ADMIN')
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.catalog.deleteCategory(id);
  }

  @Public()
  @Get('facets')
  facets() {
    return this.catalog.getCatalogFacets();
  }

  @Public()
  @Get('products')
  listProducts(@Query() query: ProductQueryDto) {
    return this.catalog.listProducts(query);
  }

  @Public()
  @Get('products/:slug')
  getProduct(@Param('slug') slug: string) {
    return this.catalog.getProductBySlug(slug);
  }

  @Public()
  @Get('products/:slug/related')
  related(@Param('slug') slug: string) {
    return this.catalog.getRelatedProducts(slug);
  }

  @Roles('ADMIN')
  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalog.createProduct(dto);
  }

  @Roles('ADMIN')
  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.catalog.updateProduct(id, dto);
  }

  @Roles('ADMIN')
  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.catalog.deleteProduct(id);
  }
}
