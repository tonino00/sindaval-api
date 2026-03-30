import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class CreateAgreementDto {
  @ApiProperty({ required: false, description: 'Alias para titulo (compatibilidade com payload do front)' })
  @ValidateIf((o) => !o.titulo)
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @ApiProperty()
  @ValidateIf((o) => !o.nome)
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({ required: false, description: 'Categoria em texto (deprecated, use categoryId)' })
  @IsString()
  @IsOptional()
  categoria?: string;

  @ApiProperty({ required: false, description: 'ID da categoria associada' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  desconto?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contato?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imagemUrl?: string;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
