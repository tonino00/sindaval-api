import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('agreements')
export class Agreement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  categoria: string;

  @Column({ type: 'int', nullable: true })
  desconto: number;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'text', nullable: true })
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
