import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type AccountingDocument = mongoose.HydratedDocument<Edo_Cuenta>; //<name of collection in Mongo>

@Schema({ collection: 'Edo_Cuenta' })
export class Edo_Cuenta {
  @Prop()
  Folio: string;
  @Prop()
  Fecha: string;
  @Prop()
  Fecha_Cancelado: string;
  @Prop()
  Referencia: string;
  @Prop()
  Descripcion: string;
  @Prop()
  Forma_de_Pago: string;
  @Prop()
  Cantidad: number;
  @Prop()
  Cargo: number;
  @Prop()
  Abono: number;
  @Prop()
  Total: number;
  @Prop()
  Estatus: string;
  @Prop()
  Autorizo: string;
  @Prop()
  hotel: string;
  @Prop()
  Cajero: string;
}

export const EdoCuentaSchema = SchemaFactory.createForClass(Edo_Cuenta);
