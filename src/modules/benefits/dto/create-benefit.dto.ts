import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBenefitDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  regrasUso?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contato?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imagemUrl?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
