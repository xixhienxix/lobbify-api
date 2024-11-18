import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type UserDocument = mongoose.HydratedDocument<usuario>;

@Schema()
export class usuario {
  @Prop()
  username: string;
  @Prop()
  passwordHash: string;
  @Prop()
  nombre: string;
  @Prop()
  email: string;
  @Prop()
  terminos: boolean;
  @Prop()
  rol: number;
  @Prop()
  perfil: number;
  @Prop()
  hotel: string;
  @Prop()
  accessToken: string;
}

export const UserSchema = SchemaFactory.createForClass(usuario);
