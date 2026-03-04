import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';
import { NotificationSegment } from '../../../common/enums/notification-segment.enum';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mensagem: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  tipo: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  canal: NotificationChannel;

  @ApiProperty({ enum: NotificationSegment, required: false })
  @IsEnum(NotificationSegment)
  @IsOptional()
  segmento?: NotificationSegment;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  targetUserId?: string;
}
