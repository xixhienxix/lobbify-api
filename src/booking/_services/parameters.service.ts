import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import { Parameters, ParametersSchema } from '../_models/parameters.model';

@Injectable({ scope: Scope.REQUEST })
export class ParametrosService {
  private parametersModel: Model<Parameters>;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    const connection: Connection = (request as any).dbConnection;
    this.parametersModel =
      connection.models['Booking_Parameters'] ||
      connection.model('Booking_Parameters', ParametersSchema);
  }

  async getAll(): Promise<Parameters> {
    const result = await this.parametersModel.findOne().catch((err) => {
      console.error('❌ [ParametersService] DB error:', err);
      throw err;
    });

    return result;
  }
}
