import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum';
import { UserStatus } from '../../../common/enums/user-status.enum';
import { EncryptionUtil } from '../../../common/utils/encryption.util';
import { Payment } from '../../payments/entities/payment.entity';
import { UserNotification } from '../../notifications/entities/user-notification.entity';
import { AuditLog } from '../../audit-logs/entities/audit-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nome_completo', length: 255 })
  nomeCompleto: string;

  @Column({ name: 'endereco_residencial', type: 'text', nullable: true })
  enderecoResidencial: string;

  @Column({ name: 'endereco_profissional', type: 'text', nullable: true })
  enderecoProfissional: string;

  @Column({ length: 20, nullable: true })
  telefone: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'numero_oab', length: 50, unique: true })
  numeroOAB: string;

  @Column({ type: 'text' })
  private cpfEncrypted: string;

  @Column({ length: 100, nullable: true })
  instagram: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.SINDICALIZADO,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ATIVO,
  })
  status: UserStatus;

  @Column({ name: 'senha_hash', type: 'text' })
  @Exclude()
  senhaHash: string;

  @Column({ name: 'qr_token', unique: true, nullable: true })
  qrToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(() => UserNotification, (userNotification) => userNotification.user)
  userNotifications: UserNotification[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs: AuditLog[];

  get cpf(): string {
    return this.cpfEncrypted ? EncryptionUtil.decrypt(this.cpfEncrypted) : null;
  }

  set cpf(value: string) {
    this.cpfEncrypted = value ? EncryptionUtil.encrypt(value) : null;
  }

  @BeforeInsert()
  @BeforeUpdate()
  encryptCpf() {
    if (this.cpfEncrypted && !this.cpfEncrypted.includes('=')) {
      this.cpfEncrypted = EncryptionUtil.encrypt(this.cpfEncrypted);
    }
  }
}
