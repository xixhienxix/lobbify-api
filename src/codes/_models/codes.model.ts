import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type CodesDocument = mongoose.HydratedDocument<code>; //<name of collection in Mongo>

@Schema()
export class code {
  @Prop()
  _id: string;
  @Prop()
  Descripcion: string;
  @Prop()
  Precio: string;
  @Prop()
  Tipo: string;
  @Prop()
  hotel: string;
}

export const CodesSchema = SchemaFactory.createForClass(code);

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
