import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import { room, RoomsSchema } from '../models/rooms.model';
import { tarifas, TarifasSchema } from 'src/tarifas/_models/tarifas.model';
import { GuestService } from 'src/guests/services/guest.service';
import { reservationStatusMap } from 'src/interfaces/reservation.status';

@Injectable({ scope: Scope.REQUEST })
export class RoomsService {
  private habModel: Model<room>;
  private tarifasModel: Model<tarifas>;

  constructor(
    private _guestService: GuestService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    const connection: Connection = (request as any).dbConnection;

    this.habModel =
      connection.models['Habitaciones'] ||
      connection.model('Habitaciones', RoomsSchema);

    this.tarifasModel =
      connection.models['Tarifas'] ||
      connection.model('Tarifas', TarifasSchema);
  }

  async findAll(): Promise<room[]> {
    return this.habModel
      .find()
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async findAllRoomCodes(): Promise<room[]> {
    return this.habModel
      .find()
      .distinct('Codigo')
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async postRoom(body: any): Promise<any> {
    const filterEdit = { Codigo: body.habitacion.Codigo };
    const { _id, ...update } = body.habitacion;
    const isEdit = body.editar === true || body.editar === 'true';

    if (isEdit) {
      try {
        const result = await this.habModel.updateMany(filterEdit, update);
        if (result.modifiedCount === 0) {
          return {
            message:
              'No documents were updated, please check your filter criteria.',
          };
        }
        return { message: 'Documents updated successfully' };
      } catch (err) {
        return { message: 'Error during update', error: err };
      }
    } else {
      const response = [];
      const errors = [];

      if (
        !Array.isArray(body.habitacion.Numero) ||
        body.habitacion.Numero.length < body.habitacion.Inventario
      ) {
        return { message: 'Invalid room numbers for the inventory size' };
      }

      for (let i = 0; i < body.habitacion.Inventario; i++) {
        await this.habModel
          .create({
            Codigo: body.habitacion.Codigo,
            Numero: body.habitacion.Numero[i],
            Descripcion: body.habitacion.Descripcion,
            Tipo: body.habitacion.Tipo,
            Personas: body.habitacion.Personas,
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
          })
          .then((data) => {
            if (!data)
              response.push({ message: 'No se pudo agregar la habitacion' });
            if (data) return { message: 'Habitaciones Dadas de Alta' };
          })
          .catch((err) => {
            errors.push(err);
            return err;
          });
      }

      return errors.length > 0 ? errors : response;
    }
  }

  async deleteRoom(codigo: any, numero: string): Promise<any> {
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const huespeds = await this._guestService.findbyCodeAndDate(codigo, {
        $or: [{ llegada: { $gte: today } }, { salida: { $gte: today } }],
      });

      if (huespeds.length > 0) return huespeds.length;

      const deleteFilter =
        numero === 'NN'
          ? { Codigo: codigo }
          : { Codigo: codigo, Numero: numero };

      const roomDeletion = await this.habModel.deleteMany(deleteFilter);

      if (roomDeletion.deletedCount === 0) return { message: 'Failed' };

      return roomDeletion ? { message: 'Success' } : { message: 'Failed' };
    } catch (error: any) {
      return { error: error.message || 'An error occurred' };
    }
  }

  async uploadImgToMongo(body: any): Promise<room[]> {
    const codigoCuarto = body.fileUploadName.split('.')[0];

    return this.habModel
      .updateMany({ Codigo: codigoCuarto }, { $set: { URL: body.downloadURL } })
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async agregarHabitacion(body: any): Promise<any> {
    const codigo = body.codigoCuarto;
    const habs = body.habitacionesArr;

    const habData = await this.habModel.find({ Codigo: codigo }).exec();

    if (habData.length === 0) return 'Habitacion not found';

    const { _id, ...updateData } = habData[0].toObject();

    const roomPromises = habs.map(async (hab: any) => {
      const newRoom = { ...updateData, Numero: hab };
      const addedRoom = new this.habModel(newRoom);
      await addedRoom.save();
      return addedRoom;
    });

    return Promise.all(roomPromises);
  }
}
