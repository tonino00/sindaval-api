import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.categoryRepository.findOne({
      where: { nome: dto.nome },
    });

    if (existing) {
      throw new ConflictException('Já existe uma categoria com este nome');
    }

    const category = this.categoryRepository.create({
      ...dto,
      ativo: dto.ativo ?? true,
    });
    return this.categoryRepository.save(category);
  }

  findAll() {
    return this.categoryRepository.find({
      where: { ativo: true },
      order: { nome: 'ASC' },
    });
  }

  findAllIncludingInactive() {
    return this.categoryRepository.find({
      order: { nome: 'ASC' },
    });
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    if (dto.nome && dto.nome !== category.nome) {
      const existing = await this.categoryRepository.findOne({
        where: { nome: dto.nome },
      });
      if (existing) {
        throw new ConflictException('Já existe uma categoria com este nome');
      }
    }

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['agreements'],
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (category.agreements && category.agreements.length > 0) {
      throw new ConflictException(
        'Não é possível excluir uma categoria que possui convênios associados',
      );
    }

    await this.categoryRepository.remove(category);
    return { message: 'Categoria removida com sucesso' };
  }
}
