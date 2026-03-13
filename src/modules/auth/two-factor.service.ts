import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TwoFactorService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  private getTwoFactorIssuer(): string {
    return this.configService.get<string>('TWO_FACTOR_ISSUER') || 'SINDAVAL';
  }

  private generateRecoveryCodes(count = 10): string[] {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const makeCode = () =>
      Array.from({ length: 10 })
        .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
        .join('');
    return Array.from({ length: count }).map(makeCode);
  }

  async generateTwoFactorSecret(userId: string, email: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    recoveryCodes: string[];
    otpauthUrl: string;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const secret = speakeasy.generateSecret({
      name: `${this.getTwoFactorIssuer()}:${email}`,
      issuer: this.getTwoFactorIssuer(),
    });

    const recoveryCodes = this.generateRecoveryCodes(10);

    user.twoFactorSecret = secret.base32;
    user.isTwoFactorEnabled = false;
    user.twoFactorRecoveryCodes = recoveryCodes;
    await this.userRepository.save(user);

    const otpauthUrl = secret.otpauth_url;
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret: secret.base32,
      qrCodeUrl,
      recoveryCodes,
      otpauthUrl,
    };
  }

  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  async verifyRecoveryCode(userId: string, recoveryCode: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorRecoveryCodes) {
      return false;
    }

    const code = (recoveryCode || '').trim();
    const index = user.twoFactorRecoveryCodes.indexOf(code);
    if (index === -1) {
      return false;
    }

    user.twoFactorRecoveryCodes.splice(index, 1);
    await this.userRepository.save(user);
    return true;
  }

  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    const ok = await this.verifyTwoFactorToken(userId, token);
    if (!ok) {
      return false;
    }

    await this.userRepository.update(userId, {
      isTwoFactorEnabled: true,
    });

    return true;
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorRecoveryCodes: null,
    });
  }

  async regenerateRecoveryCodes(userId: string): Promise<string[]> {
    const recoveryCodes = this.generateRecoveryCodes(10);

    await this.userRepository.update(userId, {
      twoFactorRecoveryCodes: recoveryCodes,
    });

    return recoveryCodes;
  }
}
