import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {}

  async createDbRecord(fileData: Express.Multer.File, userId: string) {
    const newFile = this.fileRepository.create({
      originalName: fileData.originalname,
      filename: fileData.filename,
      mimetype: fileData.mimetype,
      size: fileData.size,
      user: { id: userId },
    });

    return await this.fileRepository.save(newFile);
  }
  async findAllByUserId(userId: string) {
    return await this.fileRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' } // Los más recientes primero
    });
  }
}