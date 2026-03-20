import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment as MercadoPagoPayment } from 'mercadopago';
import type { Response } from 'express';
import { Payment } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { UserStatus } from '../../common/enums/user-status.enum';

@Injectable()
export class PaymentsService {
  private readonly checkoutCookieName = 'mp_checkout';

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  private getMercadoPagoAccessToken(): string {
    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new BadRequestException('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }
    return accessToken;
  }

  private buildMercadoPagoClient(): MercadoPagoConfig {
    return new MercadoPagoConfig({
      accessToken: this.getMercadoPagoAccessToken(),
    });
  }

  private mapMercadoPagoPaymentStatus(status?: string): PaymentStatus {
    const normalized = (status || '').toLowerCase();

    switch (normalized) {
      case 'approved':
        return PaymentStatus.APROVADO;
      case 'pending':
      case 'in_process':
      case 'in_mediation':
        return PaymentStatus.PENDENTE;
      case 'authorized':
        return PaymentStatus.PROCESSANDO;
      case 'rejected':
        return PaymentStatus.RECUSADO;
      case 'cancelled':
        return PaymentStatus.CANCELADO;
      case 'refunded':
      case 'charged_back':
        return PaymentStatus.ESTORNADO;
      default:
        return PaymentStatus.PROCESSANDO;
    }
  }

  async createCheckout(createPaymentDto: CreatePaymentDto, userId: string, res: Response): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const payment = this.paymentRepository.create({
      userId,
      valor: createPaymentDto.valor,
      metodo: createPaymentDto.metodo,
      descricao: createPaymentDto.descricao,
      status: PaymentStatus.PENDENTE,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    const client = this.buildMercadoPagoClient();
    const preference = new Preference(client);

    const notificationUrl = this.configService.get<string>('MERCADO_PAGO_NOTIFICATION_URL');
    const envBackUrlSuccess = this.configService.get<string>('MERCADO_PAGO_BACK_URL_SUCCESS');
    const envBackUrlFailure = this.configService.get<string>('MERCADO_PAGO_BACK_URL_FAILURE');
    const envBackUrlPending = this.configService.get<string>('MERCADO_PAGO_BACK_URL_PENDING');

    const backUrlSuccess = (envBackUrlSuccess || '').trim() || 'http://localhost:3001/payment/success';
    const backUrlFailure = (envBackUrlFailure || '').trim() || 'http://localhost:3001/payment/failure';
    const backUrlPending = (envBackUrlPending || '').trim() || 'http://localhost:3001/payment/pending';

    const mpPreference = await preference.create({
      body: {
        items: [
          {
            id: savedPayment.id,
            title: createPaymentDto.descricao || 'Pagamento',
            quantity: 1,
            unit_price: Number(savedPayment.valor),
            currency_id: 'BRL',
          },
        ],
        external_reference: savedPayment.id,
        back_urls: {
          success: backUrlSuccess,
          failure: backUrlFailure,
          pending: backUrlPending,
        },
        notification_url: notificationUrl || undefined,
        metadata: {
          paymentId: savedPayment.id,
          userId,
        },
      },
    });

    savedPayment.metadata = {
      ...(savedPayment.metadata || {}),
      mercadoPago: {
        preferenceId: mpPreference.id,
        initPoint: mpPreference.init_point,
        sandboxInitPoint: mpPreference.sandbox_init_point,
      },
    };

    savedPayment.gatewayTransactionId = mpPreference.id;
    await this.paymentRepository.save(savedPayment);

    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie(this.checkoutCookieName, savedPayment.id, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60,
    });

    return {
      paymentId: savedPayment.id,
      preferenceId: mpPreference.id,
      initPoint: mpPreference.init_point,
      sandboxInitPoint: mpPreference.sandbox_init_point,
      amount: savedPayment.valor,
      status: savedPayment.status,
      message: 'Checkout criado com sucesso',
    };
  }

  async getCurrentCheckout(userId: string, checkoutPaymentId?: string): Promise<Payment | null> {
    if (!checkoutPaymentId) {
      return null;
    }

    const payment = await this.paymentRepository.findOne({
      where: { id: checkoutPaymentId },
    });

    if (!payment) {
      return null;
    }

    if (payment.userId !== userId) {
      return null;
    }

    return payment;
  }

  clearCurrentCheckout(res: Response): void {
    res.clearCookie(this.checkoutCookieName, {
      path: '/',
    });
  }

  async handleWebhook(payload: any): Promise<void> {
    const mpPaymentId: string | undefined = payload?.data?.id;
    const topic: string | undefined = payload?.type || payload?.topic;

    if (!mpPaymentId) {
      throw new BadRequestException('Webhook inválido: data.id ausente');
    }

    if (topic && topic !== 'payment') {
      return;
    }

    const client = this.buildMercadoPagoClient();
    const mpPayment = new MercadoPagoPayment(client);
    const mpPaymentResponse = await mpPayment.get({ id: mpPaymentId });
    const mpData: any = mpPaymentResponse;

    const externalReference: string | undefined = mpData?.external_reference;
    if (!externalReference) {
      throw new BadRequestException('Pagamento do Mercado Pago sem external_reference');
    }

    const paymentId = externalReference;
    const status = this.mapMercadoPagoPaymentStatus(mpData?.status);
    const transactionId = String(mpData?.id || mpPaymentId);

    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    if (payment.status === PaymentStatus.APROVADO) {
      throw new BadRequestException('Pagamento já foi processado');
    }

    payment.status = status;
    payment.gatewayTransactionId = transactionId;

    payment.metadata = {
      ...(payment.metadata || {}),
      mercadoPago: {
        ...(payment.metadata?.mercadoPago || {}),
        paymentId: transactionId,
        status: mpData?.status,
        statusDetail: mpData?.status_detail,
        paymentTypeId: mpData?.payment_type_id,
        merchantOrderId: mpData?.order?.id,
        raw: mpData,
      },
    };

    if (status === PaymentStatus.APROVADO) {
      payment.dataPagamento = new Date();
      payment.user.status = UserStatus.ATIVO;
      await this.userRepository.save(payment.user);
    }

    await this.paymentRepository.save(payment);
  }

  findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    return payment;
  }

  findUserPayments(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
