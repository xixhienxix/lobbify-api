import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { PagoOption, PagoOptionSchema } from './pago-option.schema';

export type TarifasDocument = mongoose.HydratedDocument<tarifas>;

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
  @Prop()
  PlanAlimentos: string;
  @Prop()
  FlexibilidadLogistica: string;
  @Prop({ type: [PagoOptionSchema], default: [] }) // <-- key line
  FormaPago: PagoOption[];
}

export const TarifasSchema = SchemaFactory.createForClass(tarifas);
