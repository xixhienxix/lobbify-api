import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type HuespedDocument = mongoose.HydratedDocument<huesped>; //<name of collection in Mongo>

@Schema({ collection: 'Reservaciones' })
export class huesped {
  @Prop()
  _id: string;
  @Prop()
  folio: number;
  @Prop()
  adultos: number;
  @Prop()
  ninos: number;
  @Prop()
  nombre: string;
  @Prop()
  estatus: string; // Huesped en Casa = 1 | Reserva Sin Pagar = 2 | Reserva Confirmada = 3 | Hizo Checkout = 4 | Uso Interno = 5 | Bloqueo = 6 | Reserva Temporal = 7
  @Prop()
  llegada: string;
  @Prop()
  salida: string;
  @Prop()
  noches: number;
  @Prop({ type: Object })
  tarifa: any;
  @Prop()
  porPagar: number;
  @Prop()
  pendiente: number;
  @Prop()
  origen: string;
  @Prop()
  habitacion: string;
  @Prop()
  telefono: string;
  @Prop()
  email: string;
  @Prop()
  motivo: string;
  @Prop()
  fechaNacimiento: string;
  @Prop()
  trabajaEn: string;
  @Prop()
  tipoID: string;
  @Prop()
  numeroID: string;
  @Prop()
  direccion: string;
  @Prop()
  pais: string;
  @Prop()
  ciudad: string;
  @Prop()
  codigoPostal: string;
  @Prop()
  lenguaje: string;
  @Prop()
  numeroCuarto: string;
  @Prop()
  creada: string;
  @Prop()
  tipoHuesped: string;
  @Prop()
  notas: string;
  @Prop()
  vip: string;
  @Prop()
  ID_Socio: number;
  @Prop()
  estatus_Ama_De_Llaves: string;
  @Prop()
  hotel: string;
  @Prop({ type: Object })
  desgloseEdoCuenta: any;
  @Prop()
  lateCheckOut: string;
  @Prop({ required: false })
  promoCode?: string;
}

export const UserSchema = SchemaFactory.createForClass(huesped);
