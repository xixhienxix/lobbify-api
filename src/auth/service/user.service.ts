import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { usuario } from '../models/user.model';

@Injectable()
export class UserService {
  constructor(@InjectModel(usuario.name) private userModel: Model<usuario>) {}
  //@InjectConnection() private connection: Connection

  async findAll(): Promise<usuario[]> {
    return this.userModel.find().exec();
  }

  async findOne(username: string): Promise<usuario> {
    return this.userModel.findOne({ username: username }).exec();
  }

  async findHotels(): Promise<usuario[]> {
    const usuariosResultQuery = await this.userModel
      .distinct('hotel')
      .lean()
      .then((db_res) => {
        if (db_res) {
          return db_res;
        }
      })
      .catch((err) => {
        console.log(err);
        return err;
      });

    return new Promise((resolve) => {
      if (!usuariosResultQuery) {
        return;
      }
      resolve(usuariosResultQuery);
    });
  }

  async autoriza(hotel: string, body: any): Promise<any> {
    return this.userModel
      .findOne({ hotel: hotel, username: body.username })
      .then((data) => {
        if (!data) {
          return { id: 1, message: 'Nombre de usuario invalido' };
        }
        if (data) {
          this.userModel
            .findOne({
              hotel: hotel,
              username: body.username,
              password: body.password,
            })
            .then((data) => {
              if (!data) {
                return {
                  id: 2,
                  message:
                    'Password incorrecto para el usuario: ' +
                    body.username +
                    '',
                };
              }
              if (data) {
                if (data.perfil === 1) {
                  return { id: 3, message: 'Usuario Autorizado' };
                } else {
                  return { id: 4, message: 'Usuario No Autorizado' };
                }
              }
            })
            .catch((err) => {
              return err;
            });
          return data;
        }
      })
      .catch((err) => {
        return err;
      });
  }
}
