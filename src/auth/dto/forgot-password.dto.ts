import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'El correo debe tener un formato válido' })
  email!: string;
}
