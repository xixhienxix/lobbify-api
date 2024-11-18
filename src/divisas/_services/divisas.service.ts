import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { divisa } from '../_models/divisas.model';

@Injectable()
export class DivisasService {
  constructor(@InjectModel(divisa.name) private divModel: Model<divisa>) {}

  async findAll(): Promise<divisa[]> {
    return this.divModel
      .find({})
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
