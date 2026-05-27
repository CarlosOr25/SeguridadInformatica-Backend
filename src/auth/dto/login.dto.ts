import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo debe tener un formato válido' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña no puede estar vacía' })
  password!: string;
}