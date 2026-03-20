import { Controller, Get, Post, Body, Param, Res, Delete, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Criar checkout de pagamento' })
  @ApiResponse({ status: 201, description: 'Checkout criado' })
  createCheckout(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.paymentsService.createCheckout(createPaymentDto, userId, res);
  }

  @Get('checkout/current')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Obter checkout atual (cookie HttpOnly)' })
  @ApiResponse({ status: 200, description: 'Checkout atual' })
  getCurrentCheckout(@CurrentUser('id') userId: string, @Req() req: Request) {
    const checkoutPaymentId = req.cookies?.mp_checkout;
    return this.paymentsService.getCurrentCheckout(userId, checkoutPaymentId);
  }

  @Delete('checkout/current')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Limpar checkout atual (cookie HttpOnly)' })
  @ApiResponse({ status: 204, description: 'Checkout limpo' })
  clearCurrentCheckout(@Res({ passthrough: true }) res: Response) {
    return this.paymentsService.clearCurrentCheckout(res);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Webhook do gateway de pagamento' })
  @ApiResponse({ status: 200, description: 'Webhook processado' })
  handleWebhook(@Body() payload: any) {
    return this.paymentsService.handleWebhook(payload);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Listar todos pagamentos' })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('me')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Meus pagamentos' })
  findUserPayments(@CurrentUser('id') userId: string) {
    return this.paymentsService.findUserPayments(userId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Buscar pagamento por ID' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
