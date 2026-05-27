import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

export interface PublicUser {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private toPublic(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      createdAt: user.createdAt,
    };
  }

  async create(createUserDto: CreateUserDto): Promise<PublicUser> {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) throw new ConflictException('Ya existe una cuenta con ese correo');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = this.userRepository.create({
      name: createUserDto.name ?? null,
      email: createUserDto.email,
      password: hashedPassword,
    });
    const saved = await this.userRepository.save(newUser);
    return this.toPublic(saved); // nunca devolvemos el hash
  }

  findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findPublicById(id: string): Promise<PublicUser | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user ? this.toPublic(user) : null;
  }

  async setResetToken(userId: string, token: string, expires: number): Promise<void> {
    await this.userRepository.update(userId, {
      resetToken: token,
      resetTokenExpires: expires,
    });
  }

  findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { resetToken: token } });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, {
      password: hashed,
      resetToken: null,
      resetTokenExpires: null,
    });
  }
}
