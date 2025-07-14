import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Parametros } from '../models/parametros.model';
import { Model } from 'mongoose';

@Injectable()
export class ParametrosService {
  constructor(
    @InjectModel('Parametros') private parametrosModel: Model<Parametros>,
  ) {}

  async getAll(hotel: string): Promise<Parametros> {
    return this.parametrosModel
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

  async postParametros(hotel: string, body: any) {
    const filter = { hotel: hotel };
    body.parametros.hotel = hotel;
    try {
      // Delete the existing document that matches the filter
      await this.parametrosModel.deleteOne(filter);

      // Create a new document with the provided body.parametros
      const newParametros = new this.parametrosModel(body.parametros);
      const data = await newParametros.save();

      return data;
    } catch (err) {
      console.log(err); // Log any errors that occur
      return err;
    }
  }
}
