import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type DivisasDocument = mongoose.HydratedDocument<divisa>; //<name of collection in Mongo>

@Schema()
export class divisa {
  @Prop()
  _id: string;
  @Prop()
  Localidad: string;
  @Prop()
  Nombre: string;
  @Prop()
  Simbolo: string;
}

export const DivisasSchema = SchemaFactory.createForClass(divisa);
