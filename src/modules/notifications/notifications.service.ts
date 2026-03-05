import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { UserNotification } from './entities/user-notification.entity';
import { User } from '../users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationSegment } from '../../common/enums/notification-segment.enum';
import { UserStatus } from '../../common/enums/user-status.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(UserNotification)
    private userNotificationRepository: Repository<UserNotification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto, createdBy: string): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      createdBy,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    if (createNotificationDto.tipo === NotificationType.INDIVIDUAL) {
      await this.userNotificationRepository.save({
        userId: createNotificationDto.targetUserId,
        notificationId: savedNotification.id,
        lida: false,
      });
    } else {
      const segmento = createNotificationDto.segmento ?? NotificationSegment.TODOS;
      const users = await this.getUsersBySegment(segmento);
      const userNotifications = users.map(user => ({
        userId: user.id,
        notificationId: savedNotification.id,
        lida: false,
      }));
      await this.userNotificationRepository.save(userNotifications);
    }

    return savedNotification;
  }

  private async getUsersBySegment(segmento: NotificationSegment): Promise<User[]> {
    if (segmento === NotificationSegment.TODOS) {
      return this.userRepository.find();
    }
    if (segmento === NotificationSegment.ATIVO) {
      return this.userRepository.find({ where: { status: UserStatus.ATIVO } });
    }
    if (segmento === NotificationSegment.INADIMPLENTE) {
      return this.userRepository.find({ where: { status: UserStatus.INADIMPLENTE } });
    }
    return [];
  }

  findAll(): Promise<Notification[]> {
    return this.notificationRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['creator'],
    });
  }

  async findUserNotifications(userId: string): Promise<any[]> {
    const userNotifications = await this.userNotificationRepository.find({
      where: { userId },
      relations: ['notification'],
      order: { createdAt: 'DESC' },
    });

    return userNotifications.map(un => ({
      id: un.id,
      titulo: un.notification.titulo,
      mensagem: un.notification.mensagem,
      tipo: un.notification.tipo,
      canal: un.notification.canal,
      lida: un.lida,
      dataLeitura: un.dataLeitura,
      createdAt: un.notification.createdAt,
    }));
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const userNotification = await this.userNotificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!userNotification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    userNotification.lida = true;
    userNotification.dataLeitura = new Date();
    await this.userNotificationRepository.save(userNotification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.userNotificationRepository.update(
      { userId, lida: false },
      { lida: true, dataLeitura: new Date() },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.userNotificationRepository.count({
      where: { userId, lida: false },
    });
  }
}
