import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type TarifasDocument = mongoose.HydratedDocument<tarifas>; //<name of collection in Mongo>

@Schema({ collection: 'Tarifas' })
export class tarifas {
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  _id: string;
  @Prop()
  Tarifa: string;
  @Prop()
  Habitacion: string[];
  @Prop()
  Llegada: Date;
  @Prop()
  Salida: Date;
  @Prop()
  Plan: string;
  @Prop({ type: Object })
  Politicas: any;
  @Prop()
  EstanciaMinima: number;
  @Prop()
  EstanciaMaxima: number;
  @Prop()
  TarifaRack: number;
  @Prop()
  Estado: boolean;
  @Prop()
  Dias: string[];
  @Prop({ type: Object })
  TarifasActivas: any;
  @Prop({ type: Object })
  Visibilidad: any;
  @Prop({ type: Object })
  Cancelacion: any;
  @Prop()
  Adultos: number;
  @Prop()
  Ninos: number;
  @Prop()
  Descuento: number;
  @Prop()
  hotel: string;
}

export const TarifasSchema = SchemaFactory.createForClass(tarifas);
