import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ActivityService } from '../activity/activity.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly activity: ActivityService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    const payload = { sub: user.id, email: user.email };
    const access_token = await this.jwtService.signAsync(payload);
    await this.activity.log(user.id, 'login', 'Inicio de sesión');
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        createdAt: user.createdAt,
      },
    };
  }

  me(userId: string) {
    return this.usersService.findPublicById(userId);
  }

  /**
   * Genera un token de recuperación. En producción se enviaría por correo;
   * aquí lo devolvemos directamente para que el flujo sea demostrable.
   */
  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      // No revelamos si el correo existe o no.
      return { message: 'Si el correo existe, se generó un token de recuperación.' };
    }
    const token = randomBytes(24).toString('hex');
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutos
    await this.usersService.setResetToken(user.id, token, expires);
    return {
      resetToken: token,
      message: 'Token de recuperación generado (válido por 15 minutos).',
    };
  }

  async resetPassword(token: string, password: string) {
    const user = await this.usersService.findByResetToken(token);
    if (
      !user ||
      !user.resetTokenExpires ||
      Number(user.resetTokenExpires) < Date.now()
    ) {
      throw new BadRequestException('Token inválido o expirado');
    }
    if (password.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }
    await this.usersService.updatePassword(user.id, password);
    return { message: 'Contraseña actualizada con éxito.' };
  }
}
