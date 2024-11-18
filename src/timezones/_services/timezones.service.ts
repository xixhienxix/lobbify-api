import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { timezone } from '../_models/timezone.model';

@Injectable()
export class TimezonesService {
  constructor(@InjectModel(timezone.name) private TimeModel: Model<timezone>) {}

  async findAll(): Promise<timezone[]> {
    return this.TimeModel.find({})
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
