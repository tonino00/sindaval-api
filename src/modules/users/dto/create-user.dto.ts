import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';
import { UserStatus } from '../../../common/enums/user-status.enum';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nomeCompleto: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  enderecoResidencial?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  enderecoProfissional?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  numeroOAB: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cpf: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  instagram?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.SINDICALIZADO })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ enum: UserStatus, default: UserStatus.ATIVO })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}
