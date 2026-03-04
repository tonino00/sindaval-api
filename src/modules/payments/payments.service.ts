import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { UserStatus } from '../../common/enums/user-status.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async createCheckout(createPaymentDto: CreatePaymentDto, userId: string): Promise<any> {
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

    return {
      paymentId: savedPayment.id,
      amount: savedPayment.valor,
      method: savedPayment.metodo,
      status: savedPayment.status,
      message: 'Checkout criado com sucesso',
    };
  }

  async handleWebhook(payload: any): Promise<void> {
    const paymentId = payload.paymentId;
    const status = payload.status;
    const transactionId = payload.transactionId;

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
