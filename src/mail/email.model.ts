// dto/send-email.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EmailModel {
  @IsEmail()
  to: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsString()
  nombre: string;

  @IsString()
  folio: string;

  @IsString()
  llegada: string;

  @IsString()
  salida: string;

  @IsString()
  reservationCode: string;

  @IsOptional()
  @IsString()
  hotel?: string;
}
