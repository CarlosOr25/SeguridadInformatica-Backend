import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { File } from './entities/file.entity'; // Importamos la tabla

@Module({
  imports: [TypeOrmModule.forFeature([File])], // La registramos
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}