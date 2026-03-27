import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import {
  Adicional,
  AdicionalSchema,
  CreateCodeDto,
  Foliador,
  FoliadorSchema,
  code,
  CodesSchema,
  estatus,
  EstatusSchema,
} from '../_models/codes.model';

@Injectable({ scope: Scope.REQUEST })
export class CodesService {
  private codeModel: Model<code>;
  private estatusModel: Model<estatus>;
  private foliadorModel: Model<Foliador>;
  private adicionalModel: Model<Adicional>;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    const connection: Connection = (request as any).dbConnection;

    this.codeModel =
      connection.models['Codes'] || // 👈 replace 'Codes' with your actual collection name
      connection.model('Codes', CodesSchema);

    this.estatusModel =
      connection.models['Estatus'] ||
      connection.model('Estatus', EstatusSchema);

    this.foliadorModel =
      connection.models['Foliador'] ||
      connection.model('Foliador', FoliadorSchema);

    this.adicionalModel =
      connection.models['Servicios_Adicionales'] ||
      connection.model('Servicios_Adicionales', AdicionalSchema);
  }

  async findAll(): Promise<code[]> {
    return this.codeModel
      .find()
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async findAllEstatus(): Promise<estatus[]> {
    return this.estatusModel
      .find()
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async findFolios(): Promise<Foliador[]> {
    return this.foliadorModel
      .find()
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async findAdicional(): Promise<Adicional[]> {
    return this.adicionalModel
      .find()
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async postNewCode(
    codigo: CreateCodeDto,
  ): Promise<{ success: boolean; data?: code }> {
    try {
      const createdCode = await this.codeModel.create(codigo);
      return { success: true, data: createdCode };
    } catch (error) {
      console.error('Error inserting new code:', error);
      return { success: false };
    }
  }
}
