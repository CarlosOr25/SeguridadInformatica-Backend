import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Register } from './entities/register.entity';
import { RegisterType } from './entities/register-type.entity';

export type EventType =
  | 'login'
  | 'register'
  | 'upload'
  | 'download'
  | 'delete'
  | 'rename'
  | 'move'
  | 'visibility'
  | 'directory';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Register)
    private readonly registerRepo: Repository<Register>,
    @InjectRepository(RegisterType)
    private readonly typeRepo: Repository<RegisterType>,
  ) {}

  /** Busca el tipo por nombre o lo crea si aún no existe (auto-seed). */
  private async resolveType(name: EventType): Promise<RegisterType> {
    let type = await this.typeRepo.findOne({ where: { name } });
    if (!type) {
      type = await this.typeRepo.save(this.typeRepo.create({ name }));
    }
    return type;
  }

  /** Registra un evento de auditoría. Nunca lanza: la bitácora no debe romper la operación. */
  async log(userId: string, type: EventType, detail: string): Promise<void> {
    try {
      const registerType = await this.resolveType(type);
      await this.registerRepo.save(
        this.registerRepo.create({
          type: registerType,
          detail,
          user: { id: userId } as any,
        }),
      );
    } catch {
      /* la bitácora es best-effort */
    }
  }

  async listForUser(userId: string): Promise<
    Array<{ id: string; type: string; detail: string; createdAt: Date }>
  > {
    const rows = await this.registerRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 60,
    });
    return rows.map((r) => ({
      id: r.id,
      type: r.type?.name ?? 'upload',
      detail: r.detail ?? '',
      createdAt: r.createdAt,
    }));
  }
}
