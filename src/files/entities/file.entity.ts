import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type Visibility = 'private' | 'public';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  originalName!: string; // nombre real ("mi-tarea.pdf")

  @Column()
  filename!: string; // nombre del blob CIFRADO en disco

  @Column()
  mimetype!: string;

  @Column({
    type: 'bigint',
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  size!: number; // tamaño del archivo ORIGINAL (en claro), en bytes

  // --- material criptográfico (esquema híbrido) ---
  @Column({ type: 'text' })
  hash!: string; // SHA-256 del archivo en claro (integridad)

  @Column({ type: 'text' })
  iv!: string; // IV de AES-GCM (base64)

  @Column({ type: 'text' })
  wrappedKey!: string; // llave AES envuelta con la PÚBLICA del servidor (base64)

  @Column({ type: 'varchar', default: 'private' })
  visibility!: Visibility;

  @Column({ type: 'uuid', nullable: true })
  directoryId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.files, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'uuid' })
  userId!: string;
}
