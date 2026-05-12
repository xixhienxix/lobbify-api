import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ _id: true })
export class RoomImage {
  @Prop({ required: true })
  key: string; // rooms/presidencial/original_uuid.jpg

  @Prop()
  thumbKey: string; // rooms/presidencial/thumb_uuid.webp

  @Prop()
  mediumKey: string; // rooms/presidencial/medium_uuid.webp

  @Prop()
  largeKey: string; // rooms/presidencial/large_uuid.webp

  @Prop({ default: false })
  isCover: boolean;

  @Prop({ default: Date.now })
  uploadedAt: Date;
}
export const RoomImageSchema = SchemaFactory.createForClass(RoomImage);

export type HabitacionDocument = mongoose.HydratedDocument<room>; //<name of collection in Mongo>

@Schema({ collection: 'Habitaciones' })
export class room {
  @Prop()
  Codigo: string;
  @Prop()
  Numero: string;
  @Prop()
  Descripcion: string;
  @Prop()
  Estatus: string;
  @Prop()
  Camas: number;
  @Prop()
  Personas: number;
  @Prop()
  Adultos: number;
  @Prop()
  Ninos: number;
  @Prop()
  Tarifa: number;
  @Prop()
  Tipo: string;
  @Prop()
  Vista: string;
  @Prop()
  Amenidades: string[];
  @Prop()
  Tipos_Camas: string[];
  @Prop()
  Inventario: number;
  @Prop()
  Orden: number;
  @Prop()
  URL: string;
  @Prop({ type: [RoomImageSchema], default: [] })
  images: RoomImage[];
  @Prop()
  hotel: string;
}

export const RoomsSchema = SchemaFactory.createForClass(room);
