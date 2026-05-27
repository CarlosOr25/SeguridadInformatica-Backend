import { IsOptional, IsString } from 'class-validator';

/**
 * Campos (form-data) que acompañan al blob CIFRADO durante la subida.
 * Todos llegan como texto porque son parte de un multipart/form-data.
 */
export class UploadFileDto {
  @IsString()
  wrappedKey!: string; // llave AES envuelta con la pública del servidor (base64)

  @IsString()
  iv!: string; // IV de AES-GCM (base64)

  @IsString()
  hash!: string; // SHA-256 del archivo en claro (hex)

  @IsString()
  originalName!: string;

  @IsString()
  mimetype!: string;

  @IsString()
  size!: string; // se parsea a número en el servicio

  @IsOptional()
  @IsString()
  directoryId?: string;
}
