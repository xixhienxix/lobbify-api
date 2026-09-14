import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type UserDocument = mongoose.HydratedDocument<usuario>;

@Schema({ collection: 'usuarios' })
export class usuario {
  @Prop()
  username: string;
  @Prop()
  password: string;
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
  @Prop({
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  })
  hotelPrefix: string;
  @Prop({
    type: String,
    unique: true,
  })
  hotelId: string;
}

export const UsuarioSchema = SchemaFactory.createForClass(usuario);
