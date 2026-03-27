import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import {
  huesped,
  HuespedSchema as HuespedSchema,
} from '../models/huesped.model';

@Injectable({ scope: Scope.REQUEST })
export class HuespedService {
  private userModel: Model<huesped>;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    const connection: Connection = (request as any).dbConnection;
    this.userModel =
      connection.models['Reservaciones'] ||
      connection.model('Reservaciones', HuespedSchema);
  }

  async findAll(): Promise<huesped[]> {
    return this.userModel.find().exec();
  }

  async findbyRoom(roomCode: string): Promise<huesped[]> {
    return this.userModel.find({ Codigo: roomCode });
  }
}
