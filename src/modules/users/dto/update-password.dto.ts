import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  senhaAtual: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  novaSenha: string;
}
