import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectoriesService } from './directories.service';
import { DirectoriesController } from './directories.controller';
import { Directory } from './entities/directory.entity';
import { File } from '../files/entities/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Directory, File])],
  controllers: [DirectoriesController],
  providers: [DirectoriesService],
  exports: [DirectoriesService],
})
export class DirectoriesModule {}
