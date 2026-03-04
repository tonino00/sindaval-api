import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicValidationService } from './public-validation.service';
import { PublicValidationController } from './public-validation.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [PublicValidationController],
  providers: [PublicValidationService],
})
export class PublicValidationModule {}
