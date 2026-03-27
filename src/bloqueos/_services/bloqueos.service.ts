import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import { Bloqueos, BloqueosSchema } from '../_models/bloqueos.model';

@Injectable({ scope: Scope.REQUEST })
export class BloqueosService {
  private bloqueosModel: Model<Bloqueos>;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    const connection: Connection = (request as any).dbConnection;
    this.bloqueosModel =
      connection.models['Bloqueo'] ||
      connection.model('Bloqueo', BloqueosSchema);
  }

  async findAll(): Promise<Bloqueos[]> {
    return this.bloqueosModel
      .find()
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async createBloqueo(body: any) {
    const bloqueoBase = {
      Habitacion: body.Habitacion,
      Desde: body.Desde,
      Hasta: body.Hasta,
      Estatus: body.bloqueoState,
      Comentarios: body.Comentarios,
    };

    const results = await Promise.all(
      body.Cuarto.map(async (element: string) => {
        const cuartoArray = [element];

        try {
          const existingBloqueo = await this.bloqueosModel.findOne({
            Habitacion: bloqueoBase.Habitacion,
            Cuarto: cuartoArray,
            Desde: bloqueoBase.Desde,
            Hasta: bloqueoBase.Hasta,
            Estatus: bloqueoBase.Estatus,
            Comentarios: bloqueoBase.Comentarios,
          });

          if (existingBloqueo) {
            return {
              message: 'El bloqueo ya existe en la colección',
              document: existingBloqueo,
            };
          }

          const data = await this.bloqueosModel.create({
            ...bloqueoBase,
            Cuarto: cuartoArray,
          });

          return {
            message: 'Bloqueo guardado con éxito',
            document: data,
          };
        } catch (err: any) {
          console.error('Error creating document:', err);
          return {
            message: 'Error al crear el documento',
            error: err.message,
          };
        }
      }),
    );

    return results;
  }

  async deleteBloqueo(bloqueoId: string): Promise<any> {
    try {
      return await this.bloqueosModel
        .updateOne({ _id: bloqueoId }, { $set: { Completed: true } })
        .exec();
    } catch (err) {
      throw new Error('Error deleting Bloqueo');
    }
  }
}
