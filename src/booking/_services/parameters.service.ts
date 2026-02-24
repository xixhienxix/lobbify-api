import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Parameters, ParametersDocument } from '../_models/parameters.model';
import { Model } from 'mongoose';

@Injectable()
export class ParametrosService {
  constructor(
    @InjectModel(Parameters.name)
    private readonly parametersModel: Model<ParametersDocument>,
  ) {}

  async getAll(hotel: string): Promise<Parameters> {
    const query = { hotel: hotel };

    const result = await this.parametersModel.findOne(query).catch((err) => {
      console.error('❌ [ParametersService] DB error:', err);
      throw err;
    });

    if (!result) {
      // Check what IS in the collection to compare
      const allDocs = await this.parametersModel
        .find({})
        .select('hotel')
        .lean();
      console.log(
        '⚠️  No match found. All hotel values in DB:',
        allDocs.map((d) => ({
          hotel: d['hotel'],
          type: typeof d['hotel'],
          length: d['hotel']?.length,
        })),
      );
    }

    return result;
  }
}
