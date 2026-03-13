import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class Setup2faDto {
  @ApiProperty({ required: false, example: 'backup@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  twoFactorBackupEmail?: string;

  @ApiProperty({ required: false, example: 'SINDAVAL' })
  @IsOptional()
  @IsString({ message: 'Issuer deve ser uma string' })
  issuer?: string;
}
