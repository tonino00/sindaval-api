import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('benefits')
export class Benefit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  titulo: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ name: 'regras_uso', type: 'text', nullable: true })
  regrasUso: string;

  @Column({ length: 255, nullable: true })
  contato: string;

  @Column({ name: 'imagem_url', type: 'text', nullable: true })
  imagemUrl: string;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
