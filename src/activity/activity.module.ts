import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { Register } from './entities/register.entity';
import { RegisterType } from './entities/register-type.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Register, RegisterType])],
  providers: [ActivityService],
  controllers: [ActivityController],
  exports: [ActivityService],
})
export class ActivityModule {}
