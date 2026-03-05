import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Agreement } from '../agreements/entities/agreement.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { UserNotification } from '../notifications/entities/user-notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Payment, Agreement, Notification, UserNotification])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
