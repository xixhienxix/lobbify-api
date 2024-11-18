import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type LogDocument = mongoose.HydratedDocument<Log>; //<name of collection in Mongo>

@Schema({ collection: 'Logs' })
export class Log {
  @Prop()
  folio: string;
  @Prop()
  timestamp: string;
  @Prop()
  message: string;
  @Prop({ type: Object })
  propertiesChanged: string;
  @Prop({ type: Object })
  payment: string;
  @Prop()
  username: string;
  @Prop()
  hotel: string;
  @Prop()
  oldStatus?: string;
  @Prop()
  newStatus?: string;
  @Prop()
  logType?: number;
}

export const LogSchema = SchemaFactory.createForClass(Log);
