import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../../common/enums/user-status.enum';
import { TwoFactorService } from './two-factor.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private twoFactorService: TwoFactorService,
  ) {}

  async getUserById(userId: string): Promise<User> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async startTwoFactorSetup(userId: string) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const generated = await this.twoFactorService.generateTwoFactorSecret(userId, user.email);
    return { otpauthUrl: generated.otpauthUrl };
  }

  async confirmTwoFactorSetup(userId: string, token: string) {
    const enabled = await this.twoFactorService.enableTwoFactor(userId, token);
    if (!enabled) {
      throw new UnauthorizedException('Código 2FA inválido');
    }

    const user = await this.getUserById(userId);
    return { recoveryCodes: user?.twoFactorRecoveryCodes || [] };
  }

  async disableTwoFactor(userId: string) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    await this.twoFactorService.disableTwoFactor(userId);
    return { message: '2FA desativado com sucesso' };
  }

  async validateTwoFactorToken(userId: string, tokenOrRecoveryCode: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user || !user.isTwoFactorEnabled) {
      return false;
    }

    const token = (tokenOrRecoveryCode || '').trim();
    const totpOk = await this.twoFactorService.verifyTwoFactorToken(userId, token);
    if (totpOk) {
      return true;
    }

    return this.twoFactorService.verifyRecoveryCode(userId, token);
  }

  async validateUser(email: string, password: string): Promise<User> {
    console.log('🔍 [DEBUG] Tentando login com email:', email);
    
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      console.log('❌ [DEBUG] Usuário não encontrado no banco');
      throw new UnauthorizedException('Credenciais inválidas');
    }

    console.log('✅ [DEBUG] Usuário encontrado:', user.email);
    console.log('🔐 [DEBUG] Hash no banco:', user.senhaHash?.substring(0, 20) + '...');
    
    const isPasswordValid = await bcrypt.compare(password, user.senhaHash);

    console.log('🔐 [DEBUG] Senha válida?', isPasswordValid);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status === UserStatus.INATIVO) {
      console.log('❌ [DEBUG] Usuário inativo');
      throw new UnauthorizedException('Usuário inativo');
    }

    console.log('✅ [DEBUG] Login bem-sucedido!');
    return user;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      status: user.status,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nomeCompleto: user.nomeCompleto,
        cpf: user.cpf,
        role: user.role,
        status: user.status,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });

      if (!user || user.status === UserStatus.INATIVO) {
        throw new UnauthorizedException('Usuário inválido ou inativo');
      }

      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
