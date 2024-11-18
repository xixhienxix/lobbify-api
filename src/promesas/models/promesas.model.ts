import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type PromesasDocument = mongoose.HydratedDocument<Promesas>; //<name of collection in Mongo>

@Schema({ collection: 'Promesas_Pago' })
export class Promesas {
  @Prop()
  Folio: number;
  @Prop()
  Fecha: Date;
  @Prop()
  Cantidad: number;
  @Prop()
  Aplicado: boolean;
  @Prop()
  Estatus: string;
  @Prop()
  hotel: string;
}

export const PromesasSchema = SchemaFactory.createForClass(Promesas);
