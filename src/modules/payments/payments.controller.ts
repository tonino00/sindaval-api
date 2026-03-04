import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
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
  createCheckout(@Body() createPaymentDto: CreatePaymentDto, @CurrentUser('id') userId: string) {
    return this.paymentsService.createCheckout(createPaymentDto, userId);
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
