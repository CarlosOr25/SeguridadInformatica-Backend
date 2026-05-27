import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    // Inyectamos el repositorio de TypeORM para la tabla User
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // 1. Encriptamos la contraseña (el número 10 es el nivel de seguridad/saltos)
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 2. Preparamos el nuevo usuario con la contraseña ya encriptada
    const newUser = this.userRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
    });

    // 3. Lo guardamos en la base de datos y lo retornamos
    return await this.userRepository.save(newUser);
  }

  // Dejamos este método vacío por ahora, lo usaremos luego para el Login
 async findOneByEmail(email: string) {
    // Busca en la base de datos un usuario que tenga este correo
    return await this.userRepository.findOne({ where: { email } });
  }
}