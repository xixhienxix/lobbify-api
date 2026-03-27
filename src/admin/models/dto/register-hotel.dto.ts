import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class RegisterHotelDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  pais?: string;

  @IsString()
  @IsOptional()
  checkOut?: string;

  @IsString()
  @IsOptional()
  codigoZona?: string;
}
