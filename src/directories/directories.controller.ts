import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DirectoriesService } from './directories.service';
import { CreateDirectoryDto } from './dto/create-directory.dto';
import { UpdateDirectoryDto } from './dto/update-directory.dto';
import { ActivityService } from '../activity/activity.service';

@Controller('directories')
@UseGuards(AuthGuard('jwt'))
export class DirectoriesController {
  constructor(
    private readonly directoriesService: DirectoriesService,
    private readonly activity: ActivityService,
  ) {}

  @Get()
  findAll(@Request() req: any) {
    return this.directoriesService.findAll(req.user.id);
  }

  @Post()
  async create(@Request() req: any, @Body() dto: CreateDirectoryDto) {
    const dir = await this.directoriesService.create(req.user.id, dto);
    await this.activity.log(req.user.id, 'directory', `Creó la carpeta «${dir.name}»`);
    return dir;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateDirectoryDto,
  ) {
    const dir = await this.directoriesService.update(id, req.user.id, dto);
    const action = dto.parentId !== undefined ? 'move' : 'rename';
    await this.activity.log(req.user.id, action, `Carpeta «${dir.name}»`);
    return dir;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const result = await this.directoriesService.remove(id, req.user.id);
    await this.activity.log(req.user.id, 'delete', 'Eliminó una carpeta');
    return result;
  }
}
