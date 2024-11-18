import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type DisponibilidadDocument = mongoose.HydratedDocument<disponibilidad>; //<name of collection in Mongo>

@Schema({ collection: 'Disponibilidad' })
export class disponibilidad {
  @Prop()
  _id: string;
  @Prop()
  Cuarto: string;
  @Prop()
  Habitacion: string;
  @Prop()
  Estatus: number;
  @Prop()
  Llegada: Date;
  @Prop()
  Salida: Date;
  @Prop()
  Estatus_AMA: string;
  @Prop()
  hotel: string;
  @Prop()
  Folio: string;
}

export const DisponibilidadSchema =
  SchemaFactory.createForClass(disponibilidad);
