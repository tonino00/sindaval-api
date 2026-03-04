import { IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';

export class CreatePaymentDto {
  @ApiProperty({ example: 100.00 })
  @IsNumber()
  @Min(0.01)
  valor: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  metodo: PaymentMethod;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descricao?: string;
}
