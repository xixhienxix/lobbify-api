import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import { disponibilidad, DisponibilidadSchema } from '../_models/dispo.model';

@Injectable({ scope: Scope.REQUEST })
export class DisponibilidadService {
  private dispoModel: Model<disponibilidad>;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    const connection: Connection = (request as any).dbConnection;
    this.dispoModel =
      connection.models['Disponibilidad'] ||
      connection.model('Disponibilidad', DisponibilidadSchema);
  }

  async postDisponibilidadBooking(body): Promise<any> {
    const llegada = new Date(body.fechaInicial);
    const salida = new Date(body.fechaFinal);

    return this.dispoModel
      .insertMany({
        Cuarto: 'Bingo',
        Habitacion: '102B',
        Estatus: 1,
        Llegada: llegada,
        Salida: salida,
        Estatus_AMA: 'Limpio',
        Folio: '123123',
      })
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async getDisponibilidadBooking(params): Promise<disponibilidad[]> {
    return this.dispoModel
      .find({
        Llegada: {
          $gte: new Date(params.fechaInicial),
          $lt: new Date(params.fechaFinal),
        },
      })
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }
}
