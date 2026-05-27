import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RegisterType } from './register-type.entity';

/** Bitácora de auditoría (tabla register del diagrama ER). */
@Entity('register')
export class Register {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true })
  detail!: string;

  @ManyToOne(() => RegisterType, { eager: true })
  type!: RegisterType;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;
}
