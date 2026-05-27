import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/** Catálogo de tipos de evento (tabla register_type del diagrama ER). */
@Entity('register_type')
export class RegisterType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string; // login, upload, download, delete, rename, move, visibility, directory, register
}
