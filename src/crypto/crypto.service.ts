import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  generateKeyPairSync,
  privateDecrypt,
  publicEncrypt,
  constants,
} from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Mantiene el par de llaves RSA del SERVIDOR y realiza las operaciones
 * asimétricas del esquema híbrido:
 *
 *  - El cliente cifra (envuelve) la llave AES con la llave PÚBLICA del servidor
 *    al subir un archivo  -> aquí la desenvolvemos con la PRIVADA.
 *  - Al descargar, re-envolvemos esa llave AES con la llave PÚBLICA del cliente.
 *
 * El servidor nunca ve el contenido del archivo en claro; sólo manipula la
 * pequeña llave simétrica para poder re-cifrarla.
 */
@Injectable()
export class CryptoService implements OnModuleInit {
  private readonly logger = new Logger(CryptoService.name);
  private publicKeyPem!: string;
  private privateKeyPem!: string;

  onModuleInit(): void {
    const dir = join(process.cwd(), 'keys');
    const pubPath = join(dir, 'server_public.pem');
    const privPath = join(dir, 'server_private.pem');

    if (existsSync(pubPath) && existsSync(privPath)) {
      this.publicKeyPem = readFileSync(pubPath, 'utf8');
      this.privateKeyPem = readFileSync(privPath, 'utf8');
      this.logger.log('Llaves RSA del servidor cargadas desde ./keys');
      return;
    }

    this.logger.log('Generando par de llaves RSA-2048 del servidor…');
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    this.publicKeyPem = publicKey;
    this.privateKeyPem = privateKey;

    mkdirSync(dir, { recursive: true });
    writeFileSync(pubPath, publicKey);
    writeFileSync(privPath, privateKey);
    this.logger.log('Llaves RSA generadas y persistidas en ./keys');
  }

  /** Llave pública del servidor (SPKI PEM) que se entrega al cliente. */
  getPublicKey(): string {
    return this.publicKeyPem;
  }

  /** Desenvuelve (descifra) con la PRIVADA del servidor una llave AES envuelta. */
  unwrapKey(wrappedB64: string): Buffer {
    return privateDecrypt(
      {
        key: this.privateKeyPem,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(wrappedB64, 'base64'),
    );
  }

  /** Re-envuelve (cifra) la llave AES con la llave PÚBLICA del cliente. */
  rewrapKeyForClient(rawAesKey: Buffer, clientPublicKeyPem: string): string {
    const wrapped = publicEncrypt(
      {
        key: clientPublicKeyPem,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      rawAesKey,
    );
    return wrapped.toString('base64');
  }
}
