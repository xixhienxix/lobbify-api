import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import { tarifas, TarifasSchema } from '../_models/tarifas.model';
import { DateTime } from 'luxon';
import { RatesGateway } from '../_gateway/rates.gateway';
import mongoose from 'mongoose';

@Injectable({ scope: Scope.REQUEST })
export class TarifasService {
  private tarifasModel: Model<tarifas>;

  constructor(
    private ratesGateway: RatesGateway,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    const connection: Connection = (request as any).dbConnection;
    this.tarifasModel =
      connection.models['Tarifas'] ||
      connection.model('Tarifas', TarifasSchema);
  }

  async findAllRates(): Promise<tarifas[]> {
    return this.tarifasModel
      .find()
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async findActiveRates(): Promise<tarifas[]> {
    const tz = 'America/Mexico_City';
    const today = DateTime.now().setZone(tz).startOf('day').toJSDate();

    return this.tarifasModel
      .find({
        Estado: true,
        Llegada: { $lte: today },
        Salida: { $gte: today },
      })
      .exec();
  }

  async findActiveRatesByDate(date: string): Promise<tarifas[]> {
    const tz = 'America/Mexico_City';
    const targetDate = DateTime.fromISO(date, { zone: tz })
      .startOf('day')
      .toJSDate();

    return this.tarifasModel
      .find({
        Estado: true,
        Llegada: { $lte: targetDate },
        Salida: { $gte: targetDate },
      })
      .exec();
  }

  async findAllRackRates(): Promise<tarifas[]> {
    return this.tarifasModel
      .find({ Tarifa: 'Tarifa Estandar' })
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async postTarifa(body): Promise<any> {
    const id = new mongoose.Types.ObjectId();

    const newRate = new this.tarifasModel({
      _id: id,
      Tarifa: body.tarifa.Tarifa,
      Habitacion: body.tarifa.Habitacion,
      Llegada: body.tarifa.Llegada,
      Salida: body.tarifa.Salida,
      Plan: body.tarifa.Plan,
      Politicas: body.tarifa.Politicas,
      EstanciaMinima: body.tarifa.EstanciaMinima,
      EstanciaMaxima: body.tarifa.EstanciaMaxima,
      TarifaRack: body.tarifa.TarifaRack,
      TarifasActivas: body.tarifa.TarifasActivas,
      Estado: body.tarifa.Estado,
      Dias: body.tarifa.Dias,
      Adultos: body.tarifa.Adultos,
      Ninos: body.tarifa.Ninos,
      Descuento: body.tarifa.Descuento,
      Visibilidad: body.tarifa.Visibilidad,
      Cancelacion: body.tarifa.Cancelacion,
    });

    try {
      const data = await newRate.save();
      if (data) {
        this.ratesGateway.broadcastRatesUpdate();
        return { message: 'Tarifa generada con exito' };
      }
      return {
        message: 'No se pudo Guardar la Tarifa Intente de nuevo mas tarde',
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  async updateTarifaBase(body): Promise<tarifas> {
    return this.tarifasModel
      .findOneAndUpdate(
        { Habitacion: { $in: [body.tarifas.Habitacion] } },
        { TarifaRack: body.tarifas.TarifaRack },
        { upsert: true, setDefaultsOnInsert: true, new: true },
      )
      .then((data) => {
        if (!data)
          return {
            message: 'No se pudo Guardar la Tarifa Intente de nuevo mas tarde',
          };
        return { message: 'Tarifa generada con exito' };
      })
      .catch((err) => {
        console.log(err);
        return err;
      });
  }

  async updateTarifaEspecial(body): Promise<tarifas> {
    return this.tarifasModel
      .findOneAndUpdate({ _id: body.tarifas._id }, body.tarifas)
      .then((data) => {
        if (!data)
          return {
            message: 'No se pudo Guardar la Tarifa Intente de nuevo mas tarde',
          };
        return { message: 'Tarifa generada con exito' };
      })
      .catch((err) => {
        console.log(err);
        return err;
      });
  }

  async deleteTarifa(_id): Promise<any> {
    return this.tarifasModel
      .deleteOne({ _id })
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => {
        console.log(err);
        return err;
      });
  }
}
