import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ActivityService } from '../activity/activity.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly activity: ActivityService,
  ) {}

  // POST /users -> registra una nueva cuenta
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    await this.activity.log(user.id, 'register', 'Cuenta creada');
    return user;
  }
}
