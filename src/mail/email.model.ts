// dto/send-email.dto.ts
import { Prop } from '@nestjs/mongoose';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { huesped } from 'src/auth/models/huesped.model';

export class EmailModel extends huesped {
  @IsEmail()
  to: string;

  @IsNotEmpty()
  from: string;

  @IsNotEmpty()
  subject: string;

  @Prop()
  reservationCode: string;
}
