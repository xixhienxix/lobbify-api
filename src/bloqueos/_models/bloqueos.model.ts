import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type BloqueosDocument = mongoose.HydratedDocument<Bloqueos>; //<name of collection in Mongo>

@Schema({ collection: 'Bloqueo' })
export class Bloqueos {
  @Prop({ type: Object })
  Habitacion: any;
  @Prop({ type: Object })
  Cuarto: any;
  @Prop()
  Desde: Date;
  @Prop()
  Hasta: Date;
  @Prop({ type: Object })
  Estatus: any;
  @Prop()
  Comentarios: string;
  @Prop()
  hotel: string;
}
export const BloqueosSchema = SchemaFactory.createForClass(Bloqueos);
