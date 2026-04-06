import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agreement } from './entities/agreement.entity';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';

@Injectable()
export class AgreementsService {
  constructor(
    @InjectRepository(Agreement)
    private agreementRepository: Repository<Agreement>,
  ) {}

  create(dto: CreateAgreementDto) {
    const titulo = dto.titulo ?? dto.nome;

    const agreement = this.agreementRepository.create({
      ...dto,
      titulo,
      ativo: dto.ativo ?? true,
    });
    return this.agreementRepository.save(agreement);
  }

  findAll() {
    return this.agreementRepository.find({
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateAgreementDto) {
    const agreement = await this.agreementRepository.findOne({ where: { id } });
    if (!agreement) {
      throw new NotFoundException('Convênio não encontrado');
    }

    const titulo = dto.titulo ?? dto.nome;
    Object.assign(agreement, {
      ...dto,
      ...(titulo ? { titulo } : {}),
    });
    return this.agreementRepository.save(agreement);
  }

  async remove(id: string) {
    const agreement = await this.agreementRepository.findOne({ where: { id } });
    if (!agreement) {
      throw new NotFoundException('Convênio não encontrado');
    }

    await this.agreementRepository.remove(agreement);
    return { message: 'Convênio removido com sucesso' };
  }
}
