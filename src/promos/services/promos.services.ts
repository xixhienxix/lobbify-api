import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Promos } from '../models/promos.model';
import { Model } from 'mongoose';
import { DateTime } from 'luxon';
@Injectable()
export class PromosService {
  constructor(
    @InjectModel('Promos') private readonly promosModel: Model<Promos>,
  ) {}

  async findAll(hotel: string): Promise<Promos[]> {
    return this.promosModel
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

  async createPromos(hotel: string, body: any) {
    try {
      if (!body || !body.data) {
        throw new Error(
          "Invalid input data. Expected an object in 'body.data'.",
        );
      }

      const { codigo } = body.data; // Extract codigo from request data

      // Check if a promo with the same codigo already exists
      const existingPromo = await this.promosModel
        .findOne({ codigo, hotel })
        .exec();

      if (existingPromo) {
        return {
          success: false,
          message: `La Promoción con el codigo:  '${codigo}' ya existe, utilize un codigo diferente.`,
          exist: true,
        };
      }

      // Function to safely convert date strings using Luxon
      const parseDate = (dateString: string) => {
        return dateString ? DateTime.fromISO(dateString).toJSDate() : null;
      };

      // Convert string dates to Date objects using Luxon
      const data = {
        ...body.data,
        hotel,
        intialDateFCCheckIn: parseDate(body.data.intialDateFCCheckIn),
        endDateFCCheckIn: parseDate(body.data.endDateFCCheckIn),
        intialDateFC: parseDate(body.data.intialDateFC),
        endDateFC: parseDate(body.data.endDateFC),
      };
      console.log('data:', data);

      const createdData = await this.promosModel.create(data);

      return {
        success: true,
        message: 'Promos created successfully',
        data: createdData,
      };
    } catch (error) {
      console.error('Error creating promos:', error.message);

      return {
        success: false,
        message: 'Failed to create promos',
        error: error.message,
      };
    }
  }

  deletePromo(_id): Promise<any> {
    return this.promosModel
      .deleteOne({
        _id: _id,
      })
      .then((data) => {
        console.log(data);
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
