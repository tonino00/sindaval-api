import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';
import { AuditLog } from '../audit-logs/entities/audit-log.entity';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Payment, AuditLog]), ReportsModule],
  controllers: [AdminController],
})
export class AdminModule {}
