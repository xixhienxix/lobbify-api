import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type HotelDocument = mongoose.HydratedDocument<Hotel>;

@Schema({ collection: 'hotels' })
export class Hotel {
  @Prop({ required: true, unique: true })
  hotelId: string;

  @Prop({ required: true })
  nombre: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'active' })
  status: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  checkOut: string;

  @Prop()
  codigoZona: string;

  @Prop()
  telefono: string;

  @Prop()
  pais: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  })
  prefix: string;
}

export const HotelSchema = SchemaFactory.createForClass(Hotel);
