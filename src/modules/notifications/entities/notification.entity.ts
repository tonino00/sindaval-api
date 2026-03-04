import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';
import { NotificationSegment } from '../../../common/enums/notification-segment.enum';
import { User } from '../../users/entities/user.entity';
import { UserNotification } from './user-notification.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  titulo: string;

  @Column({ type: 'text' })
  mensagem: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  tipo: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  canal: NotificationChannel;

  @Column({
    type: 'enum',
    enum: NotificationSegment,
    nullable: true,
  })
  segmento: NotificationSegment;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'target_user_id', type: 'uuid', nullable: true })
  targetUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;

  @Column({ name: 'email_sent', default: false })
  emailSent: boolean;

  @Column({ name: 'whatsapp_sent', default: false })
  whatsappSent: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => UserNotification, (userNotification) => userNotification.notification)
  userNotifications: UserNotification[];
}
