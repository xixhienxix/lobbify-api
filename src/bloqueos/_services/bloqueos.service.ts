import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bloqueos } from '../_models/bloqueos.model';
@Injectable()
export class BloqueosService {
  constructor(
    @InjectModel('Bloqueos') private readonly bloqueosModel: Model<Bloqueos>,
  ) {}
  async findAll(hotel: string): Promise<Bloqueos[]> {
    return this.bloqueosModel
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
  async createBloqueo(hotel: string, body: any) {
    const bloqueoBase = {
      Habitacion: body.Habitacion,
      Desde: body.Desde,
      Hasta: body.Hasta,
      Estatus: body.bloqueoState,
      Comentarios: body.Comentarios,
      hotel: hotel,
    };

    // Use Promise.all to handle multiple room operations concurrently
    const results = await Promise.all(
      body.Cuarto.map(async (element: string) => {
        const cuartoArray = [element];

        try {
          // Check for existing documents with identical properties
          const existingBloqueo = await this.bloqueosModel.findOne({
            Habitacion: bloqueoBase.Habitacion,
            Cuarto: cuartoArray,
            Desde: bloqueoBase.Desde,
            Hasta: bloqueoBase.Hasta,
            Estatus: bloqueoBase.Estatus,
            Comentarios: bloqueoBase.Comentarios,
            hotel: bloqueoBase.hotel,
          });

          if (existingBloqueo) {
            return {
              message: 'El bloqueo ya existe en la colección',
              document: existingBloqueo,
            };
          }

          // If no existing document, create the new one
          const data = await this.bloqueosModel.create({
            ...bloqueoBase,
            Cuarto: cuartoArray,
          });

          return {
            message: 'Bloqueo guardado con éxito',
            document: data,
          };
        } catch (err) {
          console.error('Error creating document:', err);
          return {
            message: 'Error al crear el documento',
            error: err.message,
          };
        }
      }),
    );

    // Return the results for all operations
    return results;
  }

  async deleteBloqueo(bloqueoId: string): Promise<any> {
    try {
      const result = await this.bloqueosModel
        .updateOne(
          { _id: bloqueoId },
          {
            $set: {
              Completed: true,
            },
          },
        )
        .exec();
      return result;
    } catch (err) {
      throw new Error('Error deleting Bloqueo');
    }
  }
}
