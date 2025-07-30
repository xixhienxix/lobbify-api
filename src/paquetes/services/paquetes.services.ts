import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Paquetes, PaquetesDocument } from '../models/paquetes.model';
import { Model } from 'mongoose';
import { Types } from 'mongoose';

@Injectable()
export class PaquetesServices {
  constructor(
    @InjectModel(Paquetes.name) private paquetesModel: Model<PaquetesDocument>,
  ) {}

  async getAllPackages(hotel: string): Promise<Paquetes[]> {
    try {
      const result = await this.paquetesModel.find({ hotel }).exec();
      return result;
    } catch (error) {
      throw error;
    }
  }

  async postNewPackage(hotel: string, body: any) {
    try {
      // Define your unique query criteria — e.g., match by 'Nombre' and 'hotel'
      const query = { Nombre: body.Nombre, hotel };

      // Find existing document
      const existingPackage = await this.paquetesModel.findOne(query).exec();

      if (existingPackage) {
        // Update existing document by its _id
        const updated = await this.paquetesModel
          .findByIdAndUpdate(
            existingPackage._id,
            { hotel, ...body },
            { new: true },
          )
          .exec();
        return updated;
      } else {
        // Create new document if none found
        const created = await this.paquetesModel.create({ hotel, ...body });
        return created;
      }
    } catch (err) {
      // Handle errors
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

    // Force convert to string, to avoid number type passed
    idStr = idStr.toString();

    const objectId = new Types.ObjectId(idStr);

    console.log('_ID', objectId);

    return this.paquetesModel
      .deleteOne({
        _id: objectId,
      })
      .then((data) => {
        console.log('delete result', data);
        return data;
      })
      .catch((err) => {
        console.log(err);
        return err;
      });
  }
}
