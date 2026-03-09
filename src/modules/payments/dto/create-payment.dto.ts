import { Transform } from 'class-transformer';
import { IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';

export class CreatePaymentDto {
  @ApiProperty({ example: 100.00 })
  @IsNumber()
  @Min(0.01)
  valor: number;

  @ApiProperty({ enum: ['PIX', 'CARTAO', 'CARTAO_CREDITO', 'CARTAO_DEBITO'] })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.trim().toUpperCase();
    if (normalized === 'CARTAO_CREDITO' || normalized === 'CARTAO_DEBITO') {
      return PaymentMethod.CARTAO;
    }

    return normalized;
  })
  @IsEnum(PaymentMethod)
  metodo: PaymentMethod;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descricao?: string;
}
