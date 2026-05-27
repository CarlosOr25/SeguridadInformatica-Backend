import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('files') 
export class File {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  originalName!: string; // Nombre real (ej. "mi-tarea.pdf")

  @Column()
  filename!: string; // Nombre único en el servidor (ej. "1712345-mi-tarea.pdf")

  @Column()
  mimetype!: string; // Tipo (ej. "application/pdf" o "image/jpeg")

  @Column()
  size!: number; // Peso en bytes

  @CreateDateColumn()
  createdAt!: Date;

  // RELACIÓN: Muchos archivos pertenecen a UN usuario
  @ManyToOne(() => User, (user) => user.files)
  user!: User;
}