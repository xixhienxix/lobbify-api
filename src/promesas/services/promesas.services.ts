import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Promesas } from '../models/promesas.model';
import { PromesasGateWay } from '../gateway/promesas.gateway';

@Injectable()
export class PromesasService {
  constructor(
    private readonly promesasGateway: PromesasGateWay,
    @InjectModel(Promesas.name) private promesasModel: Model<Promesas>,
  ) {}

  async getPromesa(hotel: string, body: any): Promise<Promesas[]> {
    const folio = body.folio;

    return this.promesasModel
      .find({ Folio: folio, hotel: hotel })
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

  async deletePromesa(hotel: string, _id: string): Promise<any> {
    try {
      // 1. Find the document FIRST
      const promesa = await this.promesasModel.findOne({ _id, hotel });

      if (!promesa) {
        throw new Error('Promesa not found');
      }

      // 2. Store the folio before delete
      const folio = promesa.Folio;

      // 3. Now delete it
      await this.promesasModel.deleteOne({ _id, hotel });

      // 4. Broadcast using the folio
      this.promesasGateway.broadcastPromesasUpdate(folio);

      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async promesaPago(hotel: string, body: any): Promise<Promesas[]> {
    const pago = {
      Folio: body.folio,
      Fecha: body.fecha,
      Cantidad: body.cantidad,
      Estatus: body.estatus,
      Aplicado: false,
      hotel: hotel,
    };

    return this.promesasModel
      .create(pago)
      .then((data) => {
        if (!data) {
          return;
        }
        if (data) {
          this.promesasGateway.broadcastPromesasUpdate(body.folio);
          return data;
        }
      })
      .catch((err) => {
        console.log('Post Pormesa Pago', err);
        return err;
      });
  }

  async updatePromesa(hotel: string, body: any): Promise<Promesas[]> {
    const _id = body.id;

    return this.promesasModel
      .findByIdAndUpdate(
        { _id, hotel: hotel },
        { Aplicado: true, Estatus: 'Pago Hecho' },
      )
      .then((data) => {
        if (!data) {
          return;
        }
        if (data) {
          this.promesasGateway.broadcastPromesasUpdate(body.Folio);
          return data;
        }
      })
      .catch((err) => {
        return err;
      });
  }

  async updatePromesaEstatus(hotel: string, body: any): Promise<Promesas> {
    const { id: _id } = body;

    try {
      const updated = await this.promesasModel.findOneAndUpdate(
        { _id, hotel },
        { Estatus: body.estatus, Aplicado: true },
        { new: true }, // 🔥 return updated doc
      );

      if (!updated) {
        return null;
      }

      // 🔥 The actual folio comes from DB, not body
      this.promesasGateway.broadcastPromesasUpdate(updated.Folio);

      return updated;
    } catch (err) {
      return err;
    }
  }
}
