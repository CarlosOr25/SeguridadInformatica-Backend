import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  UseGuards, 
  Request, 
  Get, 
  Param, 
  Res, 
  NotFoundException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { existsSync } from 'fs';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Request() req) {
    const userId = req.user.id;
    return await this.filesService.findAllByUserId(userId);
  }
  
  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      }
    })
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    const userId = req.user.id;
    const savedFile = await this.filesService.createDbRecord(file, userId);

    return {
      mensaje: '¡Archivo subido y registrado en la base de datos con éxito!',
      archivo: savedFile,
    };
  }

  @Get(':filename')
  download(@Param('filename') filename: string, @Res() res: any) { // Cambiamos Response por any
    const filePath = join(process.cwd(), 'uploads', filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado');
    }

    return res.download(filePath);
  }
}