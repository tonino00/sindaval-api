import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Confirm2faDto {
  @ApiProperty({ example: '123456' })
  @IsString({ message: 'Código 2FA deve ser uma string' })
  @IsNotEmpty({ message: 'Código 2FA é obrigatório' })
  token: string;
}
