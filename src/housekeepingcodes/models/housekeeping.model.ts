import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type HouseKeepingDocument = mongoose.HydratedDocument<HouseKeeping>; //<name of collection in Mongo>

@Schema({ collection: 'Ama_De_Llaves' })
export class HouseKeeping {
  @Prop()
  Descripcion: string;
  @Prop()
  Color: string;
}

export const HouseKeepingSchema = SchemaFactory.createForClass(HouseKeeping);
