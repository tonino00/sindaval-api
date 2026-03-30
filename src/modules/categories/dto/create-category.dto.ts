import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nome da categoria', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @ApiProperty({ required: false, description: 'Descrição da categoria' })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ default: true, required: false, description: 'Se a categoria está ativa' })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
