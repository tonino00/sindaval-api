import { Injectable } from '@nestjs/common';
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
      return { valid: false, reason: 'TOKEN_INVALID' };
    }

    if (user.status === 'INATIVO') {
      return { valid: false, reason: 'USER_INATIVO' };
    }

    if (user.status !== 'ATIVO') {
      return { valid: false, reason: 'USER_INADIMPLENTE' };
    }

    return {
      valid: true,
      nomeCompleto: user.nomeCompleto,
      numeroOAB: user.numeroOAB,
      status: user.status,
    };
  }
}
