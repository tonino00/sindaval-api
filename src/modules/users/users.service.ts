import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, fotoUrl?: string): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: createUserDto.email }, { numeroOAB: createUserDto.numeroOAB }],
    });

    if (existingUser) {
      throw new ConflictException('Email ou número OAB já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const { password, cpf, ...rest } = createUserDto;

    const user = this.userRepository.create({
      ...rest,
      senhaHash: hashedPassword,
      ...(fotoUrl ? { fotoUrl } : {}),
    });

    user.cpf = cpf;

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find();

    return users.map((user) =>
      ({
        id: user.id,
        nomeCompleto: user.nomeCompleto,
        email: user.email,
        telefone: user.telefone,
        numeroOAB: user.numeroOAB,
        instagram: user.instagram,
        fotoUrl: user.fotoUrl,
        enderecoResidencial: user.enderecoResidencial,
        enderecoProfissional: user.enderecoProfissional,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        cpf: user.cpf,
      }) as any,
    );
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto['senhaHash'] = await bcrypt.hash(updateUserDto.password, 10);
      delete updateUserDto.password;
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async findMe(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async updateMe(userId: string, dto: UpdateMeDto, fotoUrl?: string): Promise<User> {
    const user = await this.findMe(userId);

    const anyDto = dto as any;
    if (typeof anyDto.email === 'string') {
      delete anyDto.email;
    }
    if (typeof anyDto.cpf === 'string') {
      user.cpf = anyDto.cpf;
      delete anyDto.cpf;
    }

    Object.assign(user, anyDto);
    
    if (fotoUrl !== undefined) {
      user.fotoUrl = fotoUrl;
    }

    const saved = await this.userRepository.save(user);

    return {
      id: saved.id,
      nomeCompleto: saved.nomeCompleto,
      email: saved.email,
      telefone: saved.telefone,
      numeroOAB: saved.numeroOAB,
      instagram: saved.instagram,
      fotoUrl: saved.fotoUrl,
      enderecoResidencial: saved.enderecoResidencial,
      enderecoProfissional: saved.enderecoProfissional,
      role: saved.role,
      status: saved.status,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      cpf: saved.cpf,
    } as any;
  }

  async getMe(userId: string) {
    const user = await this.findMe(userId);
    return {
      id: user.id,
      nomeCompleto: user.nomeCompleto,
      email: user.email,
      telefone: user.telefone,
      numeroOAB: user.numeroOAB,
      instagram: user.instagram,
      fotoUrl: user.fotoUrl,
      enderecoResidencial: user.enderecoResidencial,
      enderecoProfissional: user.enderecoProfissional,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      cpf: user.cpf,
    };
  }

  async updateMyPassword(userId: string, senhaAtual: string, novaSenha: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const ok = await bcrypt.compare(senhaAtual, user.senhaHash);
    if (!ok) {
      throw new ConflictException('Senha atual inválida');
    }

    user.senhaHash = await bcrypt.hash(novaSenha, 10);
    await this.userRepository.save(user);
    return { message: 'Senha alterada com sucesso' };
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
