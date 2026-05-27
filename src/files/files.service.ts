import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'path';
import { existsSync } from 'fs';
import { remove } from 'fs-extra';
import { File } from './entities/file.entity';
import { UploadFileDto } from './dto/upload-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly cryptoService: CryptoService,
  ) {}

  /** Registra el archivo CIFRADO y su material criptográfico. */
  async createEncryptedRecord(
    blob: Express.Multer.File,
    userId: string,
    dto: UploadFileDto,
  ): Promise<File> {
    const newFile = this.fileRepository.create({
      originalName: dto.originalName,
      filename: blob.filename,
      mimetype: dto.mimetype,
      size: Number(dto.size) || 0,
      hash: dto.hash,
      iv: dto.iv,
      wrappedKey: dto.wrappedKey,
      visibility: 'private',
      directoryId: dto.directoryId ?? null,
      userId,
    });
    return this.fileRepository.save(newFile);
  }

  findAll(userId: string, directoryId?: string): Promise<File[]> {
    const where: Record<string, unknown> = { userId };
    if (directoryId !== undefined) {
      where.directoryId = directoryId === 'root' ? null : directoryId;
    }
    return this.fileRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOneOwned(id: string, userId: string): Promise<File> {
    const file = await this.fileRepository.findOne({ where: { id, userId } });
    if (!file) throw new NotFoundException('Archivo no encontrado');
    return file;
  }

  /**
   * Re-envuelve la llave AES (almacenada con la pública del servidor) usando la
   * llave PÚBLICA del cliente, para que sólo ese cliente pueda recuperarla.
   */
  async getKeyForClient(id: string, userId: string, clientPublicKey: string) {
    const file = await this.findOneOwned(id, userId);
    let rewrapped: string;
    try {
      const rawAes = this.cryptoService.unwrapKey(file.wrappedKey);
      rewrapped = this.cryptoService.rewrapKeyForClient(rawAes, clientPublicKey);
    } catch {
      throw new BadRequestException('Llave pública del cliente inválida');
    }
    return {
      wrappedKey: rewrapped,
      iv: file.iv,
      hash: file.hash,
      originalName: file.originalName,
      mimetype: file.mimetype,
    };
  }

  /** Ruta absoluta del blob cifrado en disco (verifica pertenencia y existencia). */
  async getEncryptedPath(id: string, userId: string): Promise<string> {
    const file = await this.findOneOwned(id, userId);
    const path = join(process.cwd(), 'uploads', file.filename);
    if (!existsSync(path)) {
      throw new NotFoundException('El archivo cifrado no está en el disco');
    }
    return path;
  }

  async update(id: string, userId: string, dto: UpdateFileDto): Promise<File> {
    const file = await this.findOneOwned(id, userId);
    if (dto.originalName !== undefined) file.originalName = dto.originalName;
    if (dto.directoryId !== undefined) file.directoryId = dto.directoryId;
    if (dto.visibility !== undefined) file.visibility = dto.visibility;
    return this.fileRepository.save(file);
  }

  async remove(id: string, userId: string): Promise<{ deleted: true }> {
    const file = await this.findOneOwned(id, userId);
    const path = join(process.cwd(), 'uploads', file.filename);
    await remove(path).catch(() => undefined); // borra el blob del disco
    await this.fileRepository.remove(file);
    return { deleted: true };
  }
}
