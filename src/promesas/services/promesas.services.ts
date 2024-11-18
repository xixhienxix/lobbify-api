import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Promesas } from '../models/promesas.model';

@Injectable()
export class PromesasService {
  constructor(
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

  async deletePromesa(hotel: string, body: any): Promise<Promesas[]> {
    const _id = body._id;

    return this.promesasModel
      .deleteOne({ _id: _id, hotel: hotel })
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
          return data;
        }
      })
      .catch((err) => {
        return err;
      });
  }

  async updatePromesaEstatus(hotel: string, body: any): Promise<Promesas[]> {
    const _id = body.id;

    return this.promesasModel
      .findByIdAndUpdate({ _id, hotel: hotel }, { Estatus: body.estatus })
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
