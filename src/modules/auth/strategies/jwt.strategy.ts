import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = request?.cookies?.jwt;
          
          if (process.env.AUTH_DEBUG === 'true') {
            console.log('[JWT_STRATEGY]', {
              hasCookie: Boolean(token),
              hasAuthHeader: Boolean(request?.headers?.authorization),
              cookieHeader: request?.headers?.cookie?.substring(0, 100) || 'N/A',
              origin: request?.headers?.origin || 'N/A',
              path: request?.path || 'N/A',
            });
          }
          
          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      nomeCompleto: user.nomeCompleto,
      telefone: user.telefone,
      instagram: user.instagram,
      enderecoResidencial: user.enderecoResidencial,
      enderecoProfissional: user.enderecoProfissional,
      cpf: user.cpf,
      fotoUrl: user.fotoUrl,
      numeroOAB: user.numeroOAB,
      role: user.role,
      status: user.status,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };
  }
}
