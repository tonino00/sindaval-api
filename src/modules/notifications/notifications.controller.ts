import { Controller, Get, Post, Body, Patch, Param, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiCookieAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar notificação (Admin)' })
  @ApiResponse({ status: 201, description: 'Notificação criada' })
  create(@Body() createNotificationDto: CreateNotificationDto, @CurrentUser('id') userId: string) {
    return this.notificationsService.create(createNotificationDto, userId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @Header('Cache-Control', 'no-store')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Listar todas notificações (Admin)' })
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get('me/notifications')
  @Header('Cache-Control', 'no-store')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Minhas notificações' })
  findUserNotifications(@CurrentUser('id') userId: string) {
    return this.notificationsService.findUserNotifications(userId);
  }

  @Get('me/notifications/unread-count')
  @Header('Cache-Control', 'no-store')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Contador de notificações não lidas' })
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('me/notifications/:id/read')
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  markAsRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Patch('me/notifications/read-all')
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
