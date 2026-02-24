import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ParametersDocument = mongoose.HydratedDocument<Parameters>;

@Schema({ collection: 'Booking_Parameters' })
export class Parameters {
  @Prop()
  room_auto_assign: boolean;
  @Prop()
  hotel: string;
}

export const ParametersSchema = SchemaFactory.createForClass(Parameters);
