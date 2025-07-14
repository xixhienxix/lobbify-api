import { Injectable } from '@nestjs/common';
import { tarifas } from '../_models/tarifas.model';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

@Injectable()
export class TarifasService {
  constructor(
    @InjectModel(tarifas.name) private tarifasModel: Model<tarifas>,
  ) {}

  async findAllRates(hotel: string): Promise<tarifas[]> {
    return this.tarifasModel
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

  async findAllRackRates(hotel: string): Promise<tarifas[]> {
    return this.tarifasModel
      .find({ Tarifa: 'Tarifa Estandar', hotel: hotel })
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

  async postTarifa(hotel, body): Promise<tarifas[]> {
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
      hotel: hotel,
    });

    return await newRate
      .save()
      .then((data) => {
        if (!data) {
          return {
            message: 'No se pudo Guardar la Tarifa Intente de nuevo mas tarde',
          };
        }
        if (data) {
          return { message: 'Tarifa generada con exito' };
        }
      })
      .catch((err) => {
        console.log(err);
        return err;
      });
  }

  async updateTarifaBase(body): Promise<tarifas> {
    return this.tarifasModel
      .findOneAndUpdate(
        {
          Habitacion: { $in: [body.tarifas.Habitacion] },
        },
        {
          TarifaRack: body.tarifas.TarifaRack,
        },
        { upsert: true, setDefaultsOnInsert: true, new: true },
      )
      .then((data) => {
        if (!data) {
          return {
            message: 'No se pudo Guardar la Tarifa Intente de nuevo mas tarde',
          };
        }
        if (data) {
          return { message: 'Tarifa generada con exito' };
        }
      })
      .catch((err) => {
        console.log(err);
        return err;
      });
  }

  async updateTarifaEspecial(body): Promise<tarifas> {
    const update = body.tarifas;
    // let filter = {};
    // if (body.tarifas.Tarifa === 'Tarifa De Temporada') {
    //   filter = {
    //     hotel: hotel,
    //     Tarifa: body.tarifas.Tarifa,
    //     TarifasActivas: body.tarifas.TarifasActivas,
    //   };
    // } else {
    //   filter = {
    //     hotel: hotel,
    //     Tarifa: body.tarifas.Tarifa,
    //     Habitacion: body.tarifas.Habitacion,
    //   };
    // }

    return this.tarifasModel
      .findOneAndUpdate({ _id: body.tarifas._id }, update)
      .then((data) => {
        if (!data) {
          return {
            message: 'No se pudo Guardar la Tarifa Intente de nuevo mas tarde',
          };
        }
        if (data) {
          return { message: 'Tarifa generada con exito' };
        }
      })
      .catch((err) => {
        console.log(err);
        return err;
      });
  }

  async deleteTarifa(_id): Promise<any> {
    return this.tarifasModel
      .deleteOne({
        // Tarifa: body.tarifa.Tarifa,
        // Habitacion: body.tarifa.Habitacion,
        // TarifasActivas: body.tarifa.TarifasActivas,
        // hotel: hotel,
        _id: _id,
      })
      .then((data) => {
        if (!data) {
          return;
        }
        if (data) {
          return data;
        }
      })
      .catch((err) => {
        console.log(err);
        return err;
      });
  }
}
