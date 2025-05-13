import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type PromosDocument = mongoose.HydratedDocument<Promos>;

@Schema({ collection: 'Promos' })
export class Promos {
  @Prop()
  tipo: number;
  @Prop()
  nombre: string;
  @Prop()
  codigo: string;
  @Prop()
  qtyPrecio: number;
  @Prop()
  inventario: number;
  @Prop()
  minNoches: number;
  @Prop()
  maxNoches: number;
  @Prop()
  desc: string;
  @Prop()
  anticipatedNights: number;
  @Prop()
  anticipatedNightsmax: number;
  @Prop()
  payonly: number;
  @Prop()
  stay: number;
  @Prop()
  selectedDays: string[];
  @Prop({ type: Date, required: true })
  intialDateFCCheckIn: Date; // Add this
  @Prop({ type: Date, required: true })
  endDateFCCheckIn: Date; // Add this
  @Prop({ type: Date, required: true })
  intialDateFC: Date;
  @Prop({ type: Date, required: true })
  endDateFC: Date;
  @Prop()
  hotel: string;
}

export const promoSchema = SchemaFactory.createForClass(Promos);
