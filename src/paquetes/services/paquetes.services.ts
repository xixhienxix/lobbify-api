import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model, Types } from 'mongoose';
import { Paquetes, PaquetesSchema } from '../models/paquetes.model';

@Injectable({ scope: Scope.REQUEST })
export class PaquetesServices {
  private paquetesModel: Model<Paquetes>;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    const connection: Connection = (request as any).dbConnection;
    this.paquetesModel =
      connection.models['Packages'] ||
      connection.model('Packages', PaquetesSchema);
  }

  async getAllPackages(): Promise<Paquetes[]> {
    try {
      return await this.paquetesModel.find().exec();
    } catch (error) {
      throw error;
    }
  }

  async postNewPackage(body: any) {
    try {
      const query = { Nombre: body.Nombre };
      const existingPackage = await this.paquetesModel.findOne(query).exec();

      if (existingPackage) {
        return await this.paquetesModel
          .findByIdAndUpdate(existingPackage._id, { ...body }, { new: true })
          .exec();
      } else {
        return await this.paquetesModel.create({ ...body });
      }
    } catch (err) {
      return err;
    }
  }

  async deletePackete(idOrObj: any): Promise<any> {
    let idStr: string;

    if (typeof idOrObj === 'object' && idOrObj._id) {
      idStr = idOrObj._id;
    } else if (typeof idOrObj === 'string') {
      idStr = idOrObj;
    } else {
      throw new Error('Invalid id format');
    }

    const objectId = new Types.ObjectId(idStr.toString());

    return this.paquetesModel
      .deleteOne({ _id: objectId })
      .then((data) => data)
      .catch((err) => err);
  }
}
