import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type TimeZoneDocument = mongoose.HydratedDocument<timezone>; //<name of collection in Mongo>

@Schema()
export class timezone {
  @Prop()
  _id: string;
  @Prop()
  Codigo: string;
  @Prop()
  Nombre: string;
  @Prop()
  UTC: string;
}

export const TimezonesSchema = SchemaFactory.createForClass(timezone);
