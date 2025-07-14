import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Adicional,
  CreateCodeDto,
  Foliador,
  code,
  estatus,
} from '../_models/codes.model';

@Injectable()
export class CodesService {
  constructor(
    @InjectModel(code.name) private codeModel: Model<code>,
    @InjectModel('Estatus') private readonly estatusModel: Model<estatus>,
    @InjectModel('Foliador') private readonly foliadorModel: Model<Foliador>,
    @InjectModel('Adicional') private readonly adicionalModel: Model<Adicional>,
  ) {}

  async findAll(hotel: string): Promise<code[]> {
    return this.codeModel
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

  async findAllEstatus(hotel: string): Promise<estatus[]> {
    return this.estatusModel
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

  async findFolios(hotel: string): Promise<Foliador[]> {
    return this.foliadorModel
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

  async findAdicional(hotel: string): Promise<Foliador[]> {
    return this.adicionalModel
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

  async postNewCode(
    codigo: CreateCodeDto,
    hotel: string,
  ): Promise<{ success: boolean; data?: code }> {
    try {
      const codigoConHotel = { ...codigo, hotel };

      const createdCode = await this.codeModel.create(codigoConHotel);

      return {
        success: true,
        data: createdCode,
      };
    } catch (error) {
      console.error('Error inserting new code:', error);
      return {
        success: false,
      };
    }
  }
}
