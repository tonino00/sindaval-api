import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Payment, User])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
