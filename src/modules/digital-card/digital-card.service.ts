import { Injectable, NotFoundException } from '@nestjs/common';
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

    const baseUrl = this.configService.get<string>('QR_CODE_BASE_URL');
    const validationUrl = `${baseUrl}/${user.qrToken}`;

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
