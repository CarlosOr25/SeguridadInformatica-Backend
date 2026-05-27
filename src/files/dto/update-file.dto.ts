import { IsIn, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import type { Visibility } from '../entities/file.entity';

export class UpdateFileDto {
  @IsOptional()
  @IsString()
  originalName?: string;

  // null = mover a la raíz
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  directoryId?: string | null;

  @IsOptional()
  @IsIn(['private', 'public'])
  visibility?: Visibility;
}
