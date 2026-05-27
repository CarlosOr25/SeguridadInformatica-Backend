import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Directory } from './entities/directory.entity';
import { File } from '../files/entities/file.entity';
import { CreateDirectoryDto } from './dto/create-directory.dto';
import { UpdateDirectoryDto } from './dto/update-directory.dto';

@Injectable()
export class DirectoriesService {
  constructor(
    @InjectRepository(Directory)
    private readonly repo: Repository<Directory>,
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
  ) {}

  findAll(userId: string): Promise<Directory[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  private async getOwned(id: string, userId: string): Promise<Directory> {
    const dir = await this.repo.findOne({ where: { id, userId } });
    if (!dir) throw new NotFoundException('Carpeta no encontrada');
    return dir;
  }

  async create(userId: string, dto: CreateDirectoryDto): Promise<Directory> {
    if (dto.parentId) await this.getOwned(dto.parentId, userId);
    const dir = this.repo.create({
      name: dto.name,
      parentId: dto.parentId ?? null,
      userId,
    });
    return this.repo.save(dir);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateDirectoryDto,
  ): Promise<Directory> {
    const dir = await this.getOwned(id, userId);

    if (dto.name !== undefined) dir.name = dto.name;

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('Una carpeta no puede ser su propio padre');
      }
      if (dto.parentId) {
        await this.getOwned(dto.parentId, userId);
        if (await this.isDescendant(dto.parentId, id, userId)) {
          throw new BadRequestException(
            'No puedes mover una carpeta dentro de sí misma',
          );
        }
      }
      dir.parentId = dto.parentId;
    }

    return this.repo.save(dir);
  }

  /** ¿`candidate` está dentro del subárbol de `ancestor`? */
  private async isDescendant(
    candidate: string,
    ancestor: string,
    userId: string,
  ): Promise<boolean> {
    const all = await this.repo.find({ where: { userId } });
    const byId = new Map(all.map((d) => [d.id, d]));
    let cursor: string | null = candidate;
    while (cursor) {
      if (cursor === ancestor) return true;
      cursor = byId.get(cursor)?.parentId ?? null;
    }
    return false;
  }

  async remove(id: string, userId: string): Promise<{ deleted: true }> {
    const dir = await this.getOwned(id, userId);
    // Promueve el contenido a la carpeta padre para no dejar huérfanos.
    await this.fileRepo.update({ directoryId: id, userId }, { directoryId: dir.parentId });
    await this.repo.update({ parentId: id, userId }, { parentId: dir.parentId });
    await this.repo.remove(dir);
    return { deleted: true };
  }
}
