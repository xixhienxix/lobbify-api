import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { huesped } from '../models/huesped.model';
import { Model } from 'mongoose';

@Injectable()
export class HuespedService {
  constructor(@InjectModel(huesped.name) private userModel: Model<huesped>) {}

  async findAll(): Promise<huesped[]> {
    return this.userModel.find().exec();
  }

  async findbyRoom(roomCode: string): Promise<huesped[]> {
    return this.userModel.find({ Codigo: roomCode });
  }
}
