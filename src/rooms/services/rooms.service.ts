import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { room } from '../models/rooms.model';
import { Model } from 'mongoose';
import { GuestService } from 'src/guests/services/guest.service';
import { tarifas } from 'src/tarifas/_models/tarifas.model';
@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(room.name) private habModel: Model<room>,
    @InjectModel('Tarifas') private readonly tarifasModel: Model<tarifas>,
    private _guestService: GuestService,
  ) {}

  async findAll(hotel: string): Promise<room[]> {
    return this.habModel
      .find({ hotel: hotel })
      .then((data) => {
        if (!data) {
          return;
        }
        if (data) {
          return data;
        }
      })
      .catch((err) => {
        return err;
      });
  }

  async findAllRoomCodes(hotel: string): Promise<room[]> {
    return this.habModel
      .find({ hotel: hotel })
      .distinct('Codigo')
      .then((data) => {
        if (!data) {
          return;
        }
        if (data) {
          return data;
        }
      })
      .catch((err) => {
        return err;
      });
  }

  async postRoom(hotel: string, body: any): Promise<any> {
    // const filter = { Codigo: body.habitacion.Codigo };
    const filterEdit = {
      Codigo: body.habitacion.Codigo,
      Numero: body.habitacion.Numero,
    };
    const update = body.habitacion;

    if (body.editar === true) {
      this.habModel
        .findOne(filterEdit)
        .then((document) => {
          if (!document) {
            throw new Error('No document found with Codigo: 101');
          }

          const id = document._id; // Retrieve the _id from the found document

          // Remove _id from the update object to avoid the CastError
          const { _id, ...updatedData } = update;

          // Perform the update using the retrieved _id
          return this.habModel.findByIdAndUpdate(id, updatedData, {
            new: true,
          });
        })
        .then((updatedDocument) => {
          if (!updatedDocument) {
            console.log('No se pudo actualizar los datos, intente más tarde');
            return {
              message: 'No se pudo actualizar los datos, intente más tarde',
            };
          }

          console.log('Habitación actualizada con éxito');
          return { message: 'Habitación actualizada con éxito' };
        })
        .catch((err) => {
          console.log('Error during update:', err);
          return err;
        });
    } else {
      const response = [];
      const errors = [];
      for (let i = 0; i < body.habitacion.Inventario; i++) {
        await this.habModel
          .create({
            Codigo: body.habitacion.Codigo,
            Numero: body.habitacion.Numero[i],
            Descripcion: body.habitacion.Descripcion,
            Tipo: body.habitacion.Tipo,
            Adultos: body.habitacion.Adultos,
            Ninos: body.habitacion.Ninos,
            Vista: body.habitacion.Vista,
            Camas: body.habitacion.Camas,
            Inventario: body.habitacion.Inventario,
            checkbox: false,
            Orden: body.habitacion.Orden,
            Tarifa: body.habitacion.Tarifa,
            Amenidades: body.habitacion.Amenidades,
            Tipos_Camas: body.habitacion.Tipos_Camas,
            hotel: hotel,
          })
          .then((data) => {
            if (!data) {
              response.push({
                message:
                  'No se pudo agregar la habitacion intente de nuevo mas tarde',
              });
            }
            if (data) {
              return { message: 'Habitaciones Dadas de Alta' };
            }
          })
          .catch((err) => {
            errors.push(err);
            return err;
          });
      }
      if (errors) {
        return errors;
      } else {
        return response;
      }
    }
  }

  async deleteRoom(hotel: string, codigo: any): Promise<any> {
    // const filter = { hotel: hotel, Codigo: codigo };

    const huespeds = await this._guestService.findbyCodeAndDate(hotel, codigo);

    if (huespeds.length != 0) {
      return huespeds.length;
    }

    await this.habModel
      .deleteMany({ Codigo: codigo, hotel: hotel })
      .then(async (data) => {
        if (data.deletedCount != 0) {
          await this.tarifasModel
            .deleteMany(
              { Habitacion: codigo, hotel: hotel },
              { Habitacion$: 1 },
            )
            .then(async (data) => {
              if (!data) {
                return {
                  message: 'Failed',
                };
              }
              if (data) {
                return { message: 'Success' };
              }
            })
            .catch((err) => {
              return err;
            });
        }
        if (!data) {
          return {
            message: 'Failed',
          };
        }
        if (data) {
          return { message: 'Success' };
        }
      })
      .catch((err) => {
        return err;
      });
  }

  async uploadImgToMongo(hotel: string, body: any): Promise<room[]> {
    const codigoCuarto = body.fileUploadName.split('.')[0];

    return this.habModel
      .updateMany(
        { Codigo: codigoCuarto, hotel: hotel },
        { $set: { URL: body.downloadURL } },
        { upsert: true },
      )
      .then((data) => {
        if (!data) {
          return;
        }
        if (data) {
          return data;
        }
      })
      .catch((err) => {
        return err;
      });
  }
}
