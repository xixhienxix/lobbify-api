import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ParametrosDocument = mongoose.HydratedDocument<Parametros>; //<name of collection in Mongo>

@Schema({ collection: 'Parametros' })
export class Parametros {
  @Prop()
  checkOut: string;
  @Prop()
  checkIn: string;
  @Prop()
  divisa: string;
  @Prop()
  ish: number;
  @Prop()
  iva: number;
  @Prop()
  noShow: string;
  @Prop()
  zona: string;
  @Prop()
  codigoZona: string;
  @Prop()
  hotel: string;
  @Prop()
  tarifasCancelacion: string;
  @Prop()
  autoCheckOut: boolean;
  @Prop()
  noShowAutoUpdated: boolean;
  @Prop()
  inventario: number;
  @Prop()
  iddleTimer: number;
  @Prop()
  maxPersonas: number;
}

export const ParametrosSchema = SchemaFactory.createForClass(Parametros);
