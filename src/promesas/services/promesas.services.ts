import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import { Promesas, PromesasSchema } from '../models/promesas.model';
import { PromesasGateWay } from '../gateway/promesas.gateway';

@Injectable({ scope: Scope.REQUEST })
export class PromesasService {
  private promesasModel: Model<Promesas>;

  constructor(
    private readonly promesasGateway: PromesasGateWay,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    const connection: Connection = (request as any).dbConnection;
    this.promesasModel =
      connection.models['Promesas_Pago'] ||
      connection.model('Promesas_Pago', PromesasSchema);
  }

  async getPromesa(body: any): Promise<Promesas[]> {
    return this.promesasModel
      .find({ Folio: body.folio })
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async deletePromesa(_id: string): Promise<any> {
    try {
      const promesa = await this.promesasModel.findOne({ _id });
      if (!promesa) throw new Error('Promesa not found');

      const folio = promesa.Folio;
      await this.promesasModel.deleteOne({ _id });
      this.promesasGateway.broadcastPromesasUpdate(folio);

      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async promesaPago(body: any): Promise<Promesas[]> {
    const pago = {
      Folio: body.folio,
      Fecha: body.fecha,
      Cantidad: body.cantidad,
      Estatus: body.estatus,
      Aplicado: false,
    };

    return this.promesasModel
      .create(pago)
      .then((data) => {
        if (!data) return;
        this.promesasGateway.broadcastPromesasUpdate(body.folio);
        return data;
      })
      .catch((err) => {
        console.log('Post Promesa Pago', err);
        return err;
      });
  }

  async updatePromesa(body: any): Promise<Promesas[]> {
    return this.promesasModel
      .findByIdAndUpdate(
        { _id: body.id },
        { Aplicado: true, Estatus: 'Pago Hecho' },
      )
      .then((data) => {
        if (!data) return;
        this.promesasGateway.broadcastPromesasUpdate(body.Folio);
        return data;
      })
      .catch((err) => err);
  }

  async updatePromesaEstatus(body: any): Promise<Promesas> {
    try {
      const updated = await this.promesasModel.findOneAndUpdate(
        { _id: body.id },
        { Estatus: body.estatus, Aplicado: true },
        { new: true },
      );

      if (!updated) return null;

      this.promesasGateway.broadcastPromesasUpdate(updated.Folio);
      return updated;
    } catch (err: any) {
      return err;
    }
  }
}
