import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DigitalCardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async generateQRCode(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!user.qrToken) {
      user.qrToken = uuidv4();
      await this.userRepository.save(user);
    }

    const appPublicUrl = this.configService.get<string>('APP_PUBLIC_URL');
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    const baseUrl = appPublicUrl || (nodeEnv === 'development' ? 'http://192.168.0.127:3001' : null);

    if (!baseUrl) {
      throw new BadRequestException('APP_PUBLIC_URL não configurada');
    }

    const normalizedBase = baseUrl.replace(/\/$/, '');
    const validationUrl = `${normalizedBase}/public/validar/${user.qrToken}`;

    const qrCodeDataUrl = await QRCode.toDataURL(validationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
    });

    return qrCodeDataUrl;
  }

  async getCardInfo(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      nomeCompleto: user.nomeCompleto,
      numeroOAB: user.numeroOAB,
      email: user.email,
      status: user.status,
      qrToken: user.qrToken,
    };
  }
}
