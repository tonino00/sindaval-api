import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { UserNotification } from './entities/user-notification.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../../common/services/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, UserNotification, User])],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService],
})
export class NotificationsModule {}
