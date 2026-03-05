import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateMeDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nomeCompleto?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  telefone?: string;

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
  instagram?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  numeroOAB?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  cpf?: string;
}
