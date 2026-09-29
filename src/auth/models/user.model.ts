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
  // Denormalized from the admin-registry Hotel document at login time
  // (see UserService.loginFromAdmin). Every user under the same hotel
  // shares the same value — it identifies the hotel, not the user — so
  // it must NOT be unique at this collection's level. Uniqueness for
  // hotelId/prefix is already enforced on the Hotel schema itself.
  @Prop({
    type: String,
    required: true,
    uppercase: true,
    index: true,
  })
  hotelPrefix: string;

  @Prop({
    type: String,
    index: true,
  })
  hotelId: string;
}

export const UsuarioSchema = SchemaFactory.createForClass(usuario);
