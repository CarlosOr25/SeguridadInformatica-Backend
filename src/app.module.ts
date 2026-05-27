import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        // Aquí está la magia: si no lee el .env, usa los textos en verde
        host: config.get<string>('DB_HOST') || 'localhost',
        port: config.get<number>('DB_PORT') || 5432,
        username: config.get<string>('DB_USER') || 'root',
        password: config.get<string>('DB_PASSWORD') || 'rootpassword',
        database: config.get<string>('DB_NAME') || 'mediafiredb',
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    UsersModule,
    AuthModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}