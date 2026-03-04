import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BenefitsService } from './benefits.service';
import { BenefitsController } from './benefits.controller';
import { Benefit } from './entities/benefit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Benefit])],
  controllers: [BenefitsController],
  providers: [BenefitsService],
})
export class BenefitsModule {}
