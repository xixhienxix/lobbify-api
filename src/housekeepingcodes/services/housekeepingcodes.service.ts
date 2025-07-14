import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HouseKeeping } from '../models/housekeeping.model';
import { room } from 'src/rooms/models/rooms.model';
@Injectable()
export class HouseKeepingService {
  constructor(
    @InjectModel(HouseKeeping.name)
    private houseKeepingModel: Model<HouseKeeping>,
    @InjectModel(room.name) private readonly roomsModel: Model<room>,
  ) {}

  async findAll(hotel: string): Promise<HouseKeeping[]> {
    return this.houseKeepingModel
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

  async updateEstatus(hotel: string, body: any) {
    return this.roomsModel
      .findOneAndUpdate(
        { hotel: hotel, Numero: body.cuarto },
        {
          $set: {
            Estatus: body.estatus,
          },
        },
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
        console.log(err);
        return err;
      });
  }
}
