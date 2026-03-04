import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';
import { UserStatus } from '../../common/enums/user-status.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async getDashboard() {
    const totalSindicalizados = await this.userRepository.count();
    const totalInadimplentes = await this.userRepository.count({
      where: { status: UserStatus.INADIMPLENTE },
    });
    const totalAtivos = await this.userRepository.count({
      where: { status: UserStatus.ATIVO },
    });

    const pagamentosPix = await this.paymentRepository.count({
      where: { metodo: PaymentMethod.PIX, status: PaymentStatus.APROVADO },
    });
    const pagamentosCartao = await this.paymentRepository.count({
      where: { metodo: PaymentMethod.CARTAO, status: PaymentStatus.APROVADO },
    });

    const percentualAdimplencia = totalSindicalizados > 0
      ? ((totalAtivos / totalSindicalizados) * 100).toFixed(2)
      : 0;

    const totalRecebido = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.valor)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.APROVADO })
      .getRawOne();

    return {
      totalSindicalizados,
      totalInadimplentes,
      totalAtivos,
      pagamentosPix,
      pagamentosCartao,
      percentualAdimplencia: `${percentualAdimplencia}%`,
      totalRecebido: parseFloat(totalRecebido?.total || 0),
    };
  }

  async exportCsv(): Promise<string> {
    const users = await this.userRepository.find({
      select: ['nomeCompleto', 'email', 'telefone', 'status', 'numeroOAB'],
    });

    let csv = 'Nome,Email,Telefone,Status,Numero OAB\n';
    users.forEach(user => {
      csv += `${user.nomeCompleto},${user.email},${user.telefone || ''},${user.status},${user.numeroOAB}\n`;
    });

    return csv;
  }
}
