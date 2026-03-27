import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import { HouseKeeping, HouseKeepingSchema } from '../models/housekeeping.model';
import { room, RoomsSchema } from 'src/rooms/models/rooms.model';
import { HousekeepingGateway } from '../gateway/housekeeping.gateway';

@Injectable({ scope: Scope.REQUEST })
export class HouseKeepingService {
  private houseKeepingModel: Model<HouseKeeping>;
  private roomsModel: Model<room>;

  constructor(
    private housekeepingGateway: HousekeepingGateway,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    const connection: Connection = (request as any).dbConnection;

    this.houseKeepingModel =
      connection.models['Ama_De_Llaves'] ||
      connection.model('Ama_De_Llaves', HouseKeepingSchema);

    this.roomsModel =
      connection.models['Habitaciones'] ||
      connection.model('Habitaciones', RoomsSchema);
  }

  async findAll(): Promise<HouseKeeping[]> {
    return this.houseKeepingModel
      .find()
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async updateEstatus(body: any) {
    return this.roomsModel
      .findOneAndUpdate(
        { Numero: body.cuarto },
        { $set: { Estatus: body.estatus } },
        { new: true },
      )
      .then((updatedRoom) => {
        if (!updatedRoom) return null;
        this.housekeepingGateway.broadcastHousekeepingUpdate(updatedRoom);
        return updatedRoom;
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  }
}
