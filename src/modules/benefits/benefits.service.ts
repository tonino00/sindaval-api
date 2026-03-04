import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Benefit } from './entities/benefit.entity';
import { CreateBenefitDto } from './dto/create-benefit.dto';
import { UpdateBenefitDto } from './dto/update-benefit.dto';

@Injectable()
export class BenefitsService {
  constructor(
    @InjectRepository(Benefit)
    private benefitRepository: Repository<Benefit>,
  ) {}

  create(createBenefitDto: CreateBenefitDto): Promise<Benefit> {
    const benefit = this.benefitRepository.create(createBenefitDto);
    return this.benefitRepository.save(benefit);
  }

  findAll(): Promise<Benefit[]> {
    return this.benefitRepository.find({ where: { ativo: true } });
  }

  async findOne(id: string): Promise<Benefit> {
    const benefit = await this.benefitRepository.findOne({ where: { id } });
    if (!benefit) {
      throw new NotFoundException('Benefício não encontrado');
    }
    return benefit;
  }

  async update(id: string, updateBenefitDto: UpdateBenefitDto): Promise<Benefit> {
    const benefit = await this.findOne(id);
    Object.assign(benefit, updateBenefitDto);
    return this.benefitRepository.save(benefit);
  }

  async remove(id: string): Promise<void> {
    const benefit = await this.findOne(id);
    await this.benefitRepository.remove(benefit);
  }
}
