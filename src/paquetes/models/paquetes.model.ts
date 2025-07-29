import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type PaquetesDocument = mongoose.HydratedDocument<Paquetes>; //<name of collection in Mongo>

@Schema({ collection: 'Packages' })
export class Paquetes {
  @Prop()
  Nombre: string;
  @Prop({ type: [String] })
  Habitacion: string[];
  @Prop({ type: [String] })
  Categoria: string[];
  @Prop()
  Precio: number;
  @Prop()
  Cantidad: number;
  @Prop()
  Descripcion: string;
  @Prop()
  hotel: string;
}

export const PaquetesSchema = SchemaFactory.createForClass(Paquetes);
