import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { room } from '../models/rooms.model';
import { Model } from 'mongoose';
import { GuestService } from 'src/guests/services/guest.service';
import { tarifas } from 'src/tarifas/_models/tarifas.model';
import { reservationStatusMap } from 'src/interfaces/reservation.status';
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
    const filterEdit = {
      Codigo: body.habitacion.Codigo,
    };

    // Make sure to remove the _id from the update object before calling updateMany
    const { _id, ...update } = body.habitacion;

    // Check if body.editar is true before proceeding with the update
    if (body.editar === true) {
      try {
        const result = await this.habModel.updateMany(filterEdit, update);

        // Check if any documents were modified
        if (result.modifiedCount === 0) {
          console.log('No documents were updated.');
          return {
            message:
              'No documents were updated, please check your filter criteria.',
          };
        }

        console.log('Documents updated successfully');
        return { message: 'Documents updated successfully' };
      } catch (err) {
        console.log('Error during update:', err);
        return { message: 'Error during update', error: err };
      }
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

  async deleteRoom(hotel: string, codigo: any, numero: string): Promise<any> {
    console.log('codigo: ', codigo);
    // const filter = { hotel: hotel, Codigo: codigo };
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); // ensures we start comparing from midnight UTC

      const huespeds = await this._guestService.findbyCodeAndDate(
        hotel,
        codigo,
        {
          $or: [{ llegada: { $gte: today } }, { salida: { $gte: today } }],
        },
      );

      console.log('huespeds RESULT FROM DELETE filter--->', huespeds);

      if (huespeds.length > 0) {
        return huespeds.length;
      }

      const deleteFilter =
        numero === 'NN'
          ? { Codigo: codigo, hotel }
          : { Codigo: codigo, Numero: numero, hotel };

      console.log('>> Deleted: ', deleteFilter);
      const roomDeletion = await this.habModel.deleteMany(deleteFilter);

      if (roomDeletion.deletedCount === 0) {
        console.log('error deletion: ', roomDeletion);
        return { message: 'Failed' };
      }
      // const tarifasDeletion = await this.tarifasModel.deleteMany({
      //   Habitacion: codigo,
      //   hotel,
      // });

      return roomDeletion ? { message: 'Success' } : { message: 'Failed' };
    } catch (error) {
      return { error: error.message || 'An error occurred' };
    }
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

  async agregarHabitacion(hotel: string, body: any): Promise<any> {
    console.log('Agregar habitaciones', body);
    const codigo = body.codigoCuarto;
    const habs = body.habitacionesArr;

    const habData = await this.habModel.find({ Codigo: codigo }).exec();

    if (habData.length === 0) {
      return 'Habitacion not found'; // If habData does not exist, throw an error
    }

    // Destructure _id from habData and get the remaining properties for updating
    const { _id, ...updateData } = habData[0].toObject(); // Convert Mongoose object to plain object

    // Loop through habitacionesArr
    const roomPromises = habs.map(async (hab: any) => {
      const newRoom = {
        ...updateData, // Spread the properties from the first habData object (without _id)
        Numero: hab, // Replace the Numero with the value from the current item in habs
      };

      // Add the new room object to the database
      const addedRoom = new this.habModel(newRoom);
      await addedRoom.save(); // Save the new room to the database

      return addedRoom; // Optionally, return the added room for further use
    });

    // Wait for all rooms to be added to the database
    const addedRooms = await Promise.all(roomPromises);

    return addedRooms; // Return the array of added rooms
  }
}
