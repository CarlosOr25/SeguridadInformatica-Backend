import { IsString } from 'class-validator';

export class DownloadKeyDto {
  @IsString()
  publicKey!: string; // llave pública RSA del cliente (SPKI PEM)
}
