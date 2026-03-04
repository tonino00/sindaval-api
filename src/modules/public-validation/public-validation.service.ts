import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PublicValidationService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async validateCard(token: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { qrToken: token } });

    if (!user) {
      throw new NotFoundException('Carteira não encontrada');
    }

    return {
      valido: true,
      nomeCompleto: user.nomeCompleto,
      numeroOAB: user.numeroOAB,
      status: user.status,
      mensagem: user.status === 'ATIVO' ? 'Carteira válida e ativa' : 'Carteira inadimplente',
    };
  }
}
