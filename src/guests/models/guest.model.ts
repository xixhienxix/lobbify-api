import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type GuestDocument = mongoose.HydratedDocument<huespeds>; //<name of collection in Mongo>

@Schema({ collection: 'Reservaciones' })
export class huespeds {
  @Prop()
  folio: string;
  @Prop()
  adultos: number;
  @Prop()
  ninos: number;
  @Prop()
  nombre: string;
  // apellido: string;
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
  //Otros Detalles
  @Prop()
  fechaNacimiento: string;
  @Prop()
  trabajaEn: string;
  @Prop()
  tipoDeID: string;
  @Prop()
  numeroDeID: string;
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
}

export const GuestSchema = SchemaFactory.createForClass(huespeds);

export type PromesasDocument = mongoose.HydratedDocument<Promesas>; //<name of collection in Mongo>

@Schema({ collection: 'Promesas_Pago' })
export class Promesas {
  @Prop()
  Folio: string;
  @Prop()
  Fecha: Date;
  @Prop()
  Cantidad: number;
  @Prop()
  Aplicado: boolean;
  @Prop()
  Estatus: string;
  @Prop()
  hotel: string;
  // apellido: string;
}

export const PromesasSchema = SchemaFactory.createForClass(Promesas);

// HUESPED DETAILS
export type HuespedDetailsDocument = mongoose.HydratedDocument<HuespedDetails>; //<name of collection in Mongo>

@Schema({ collection: 'Detalles_Huesped' })
export class HuespedDetails {
  @Prop()
  ID_Socio: number;
  @Prop()
  Nombre: string;
  @Prop()
  email: string;
  @Prop()
  telefono: string;
  @Prop()
  tipoHuesped: string;
  @Prop()
  fechaNacimiento: string;
  @Prop()
  trabajaEn: string;
  @Prop()
  tipoDeID: string;
  @Prop()
  numeroDeID: string;
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
  notas: string;
  @Prop()
  hotel: string;
}

export const HuespedDetailsSchema =
  SchemaFactory.createForClass(HuespedDetails);
