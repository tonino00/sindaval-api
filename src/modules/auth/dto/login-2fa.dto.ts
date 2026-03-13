import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class Login2faDto {
  @ApiProperty({ example: 'usuario@example.com' })
  @IsString({ message: 'Email deve ser uma string' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;

  @ApiProperty({ example: '123456' })
  @IsString({ message: 'Código 2FA deve ser uma string' })
  @IsNotEmpty({ message: 'Código 2FA é obrigatório' })
  twoFactorToken: string;

  @ApiProperty({ required: false, example: 'NOMECODIGO10' })
  @IsOptional()
  @IsString({ message: 'Recovery code deve ser uma string' })
  recoveryCode?: string;
}
