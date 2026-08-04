// pago-option.schema.ts
import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type PagoOptionDocument = mongoose.HydratedDocument<PagoOption>;

@Schema({ _id: false }) // no separate _id for each subdocument
export class PagoOption {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: false })
  value: boolean;
}

export const PagoOptionSchema = SchemaFactory.createForClass(PagoOption);
