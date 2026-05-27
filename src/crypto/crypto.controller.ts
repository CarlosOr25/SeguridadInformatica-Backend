import { Controller, Get } from '@nestjs/common';
import { CryptoService } from './crypto.service';

@Controller('crypto')
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  /** Entrega la llave pública RSA del servidor para el cifrado híbrido. */
  @Get('public-key')
  getPublicKey(): { publicKey: string } {
    return { publicKey: this.cryptoService.getPublicKey() };
  }
}
