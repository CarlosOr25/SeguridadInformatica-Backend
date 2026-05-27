import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { File } from '../../files/entities/file.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', nullable: true })
  name!: string | null;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  // --- recuperación de contraseña ("olvidé mi contraseña") ---
  @Column({ type: 'varchar', nullable: true })
  resetToken!: string | null;

  @Column({ type: 'bigint', nullable: true })
  resetTokenExpires!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  // Un usuario puede tener MUCHOS archivos
  @OneToMany(() => File, (file) => file.user)
  files!: File[];
}
