import {
  Controller,
  Post,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Get,
  Param,
  Query,
  Body,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { DownloadKeyDto } from './dto/download-key.dto';
import { ActivityService } from '../activity/activity.service';

@Controller('files')
@UseGuards(AuthGuard('jwt'))
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly activity: ActivityService,
  ) {}

  /** Lista los archivos del usuario, opcionalmente filtrados por carpeta. */
  @Get()
  findAll(@Request() req: any, @Query('directoryId') directoryId?: string) {
    return this.filesService.findAll(req.user.id, directoryId);
  }

  /** Sube un blob YA CIFRADO en el cliente + su material criptográfico. */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${unique}${extname(file.originalname) || '.enc'}`);
        },
      }),
      limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB de ciphertext
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
    @Body() dto: UploadFileDto,
  ) {
    if (!file) throw new BadRequestException('No se recibió el archivo cifrado');
    const saved = await this.filesService.createEncryptedRecord(file, req.user.id, dto);
    await this.activity.log(req.user.id, 'upload', `Subió «${saved.originalName}»`);
    return saved;
  }

  /** Re-envuelve la llave AES con la pública del cliente (paso de descarga). */
  @Post(':id/key')
  async downloadKey(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: DownloadKeyDto,
  ) {
    const key = await this.filesService.getKeyForClient(id, req.user.id, dto.publicKey);
    await this.activity.log(req.user.id, 'download', `Descargó «${key.originalName}»`);
    return key;
  }

  /** Entrega los bytes CIFRADOS del archivo. */
  @Get(':id/raw')
  async raw(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const path = await this.filesService.getEncryptedPath(id, req.user.id);
    return res.sendFile(path);
  }

  /** Renombrar / mover / cambiar visibilidad. */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateFileDto,
  ) {
    const file = await this.filesService.update(id, req.user.id, dto);
    const action =
      dto.visibility !== undefined
        ? 'visibility'
        : dto.directoryId !== undefined
          ? 'move'
          : 'rename';
    await this.activity.log(req.user.id, action, `Archivo «${file.originalName}»`);
    return file;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const file = await this.filesService.findOneOwned(id, req.user.id);
    const name = file.originalName;
    const result = await this.filesService.remove(id, req.user.id);
    await this.activity.log(req.user.id, 'delete', `Eliminó «${name}»`);
    return result;
  }
}
