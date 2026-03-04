import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalCardService } from './digital-card.service';
import { DigitalCardController } from './digital-card.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [DigitalCardController],
  providers: [DigitalCardService],
})
export class DigitalCardModule {}
