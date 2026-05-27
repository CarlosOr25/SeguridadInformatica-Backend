import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { File } from '../../files/entities/file.entity'; // <-- 1. Importamos File aquí

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // <-- 2. Agregamos esta relación al final
  // Un usuario puede tener MUCHOS archivos
  @OneToMany(() => File, (file) => file.user)
  files!: File[];
}