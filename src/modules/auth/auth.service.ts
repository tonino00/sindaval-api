import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../../common/enums/user-status.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

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
