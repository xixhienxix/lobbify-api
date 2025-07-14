import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { IsString, IsNotEmpty } from 'class-validator';

export type CodesDocument = mongoose.HydratedDocument<code>; //<name of collection in Mongo>

@Schema()
export class code {
  @Prop()
  Descripcion: string;
  @Prop()
  Precio: number;
  @Prop()
  Tipo: string;
  @Prop()
  hotel: string;
  @Prop()
  Clasificacion: string;
}

export const CodesSchema = SchemaFactory.createForClass(code);

export class CreateCodeDto {
  @IsString()
  @IsNotEmpty()
  Descripcion: string;

  @IsNotEmpty()
  Precio: number;

  @IsString()
  @IsNotEmpty()
  Tipo: string;

  @IsString()
  @IsNotEmpty()
  Clasificacion: string;
}

export type EstatusDocument = mongoose.HydratedDocument<estatus>;

@Schema({ collection: 'Estatus' })
export class estatus {
  @Prop()
  id: number;
  @Prop()
  color: string;
  @Prop()
  hotel: string;
  @Prop()
  estatus: string;
}

export const EstatusSchema = SchemaFactory.createForClass(estatus);

export type FoliadorDocument = mongoose.HydratedDocument<Foliador>; //<name of collection in Mongo>

@Schema({ collection: 'Foliador' })
export class Foliador {
  @Prop()
  _id: string;
  @Prop()
  Folio: string;
  @Prop()
  Letra: string;
  @Prop()
  hotel: string;
}
export const FoliadorSchema = SchemaFactory.createForClass(Foliador);

export type AdicionalDocument = mongoose.HydratedDocument<Adicional>;

@Schema({ collection: 'Servicios_Adicionales' })
export class Adicional {
  @Prop()
  Descripcion: string;
  @Prop()
  Adicional: string;
  @Prop()
  hotel: string;
}
export const AdicionalSchema = SchemaFactory.createForClass(Adicional);
