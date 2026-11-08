import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser, Public } from '../auth/auth.decorators';
import { CartService } from './cart.service';
import { AddToCartDto, MergeCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  private owner(userId: string | undefined, sessionId?: string) {
    return { userId, sessionId };
  }

  @Public()
  @Get()
  getCart(
    @CurrentUser('id') userId: string | undefined,
    @Headers('x-cart-session') sessionId?: string,
  ) {
    return this.cart.getCart(this.owner(userId, sessionId));
  }

  @Public()
  @Post('items')
  addItem(
    @CurrentUser('id') userId: string | undefined,
    @Body() dto: AddToCartDto,
    @Headers('x-cart-session') sessionId?: string,
  ) {
    return this.cart.addItem(
      this.owner(userId, sessionId),
      dto.productId,
      dto.quantity ?? 1,
    );
  }

  @Public()
  @Patch('items/:itemId')
  updateItem(
    @CurrentUser('id') userId: string | undefined,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Headers('x-cart-session') sessionId?: string,
  ) {
    return this.cart.updateItem(
      this.owner(userId, sessionId),
      itemId,
      dto.quantity,
    );
  }

  @Public()
  @Delete('items/:itemId')
  removeItem(
    @CurrentUser('id') userId: string | undefined,
    @Param('itemId') itemId: string,
    @Headers('x-cart-session') sessionId?: string,
  ) {
    return this.cart.removeItem(this.owner(userId, sessionId), itemId);
  }

  @Public()
  @Delete()
  clear(
    @CurrentUser('id') userId: string | undefined,
    @Headers('x-cart-session') sessionId?: string,
  ) {
    return this.cart.clear(this.owner(userId, sessionId));
  }

  @Post('merge')
  merge(@CurrentUser('id') userId: string, @Body() dto: MergeCartDto) {
    return this.cart.mergeGuestCart(userId, dto.sessionId);
  }
}
