import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Promos } from '../models/promos.model';
import { Model } from 'mongoose';
import { DateTime } from 'luxon';
import { PromosGateway } from '../gateway/promos.gateway';
@Injectable()
export class PromosService {
  constructor(
    private readonly promosGateway: PromosGateway,
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

      const { codigo } = body.data;

      const parseDate = (dateString: string) => {
        return dateString ? DateTime.fromISO(dateString).toJSDate() : null;
      };

      const data = {
        ...body.data,
        hotel,
        intialDateFCCheckIn: parseDate(body.data.intialDateFCCheckIn),
        endDateFCCheckIn: parseDate(body.data.endDateFCCheckIn),
        intialDateFC: parseDate(body.data.intialDateFC),
        endDateFC: parseDate(body.data.endDateFC),
      };

      // Remove codigo from the update payload — never overwrite it
      const { codigo: _omit, ...updateData } = data;

      const existingPromo = await this.promosModel
        .findOne({ codigo, hotel })
        .exec();

      if (existingPromo) {
        // Promo exists — update everything except codigo
        const updated = await this.promosModel
          .findOneAndUpdate(
            { codigo, hotel }, // find by these
            { $set: updateData }, // update everything else
            { new: true }, // return updated document
          )
          .exec();

        this.promosGateway.broadcastPromosUpdate();

        return {
          success: true,
          message: 'Promos updated successfully',
          data: updated,
          updated: true, // frontend can differentiate create vs update if needed
        };
      }

      // Promo doesn't exist — create it
      const createdData = await this.promosModel.create(data);
      this.promosGateway.broadcastPromosUpdate();

      return {
        success: true,
        message: 'Promos created successfully',
        data: createdData,
        updated: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating promos:', message);
      return {
        success: false,
        message: 'Failed to create promos',
        error: message,
      };
    }
  }

  deletePromo(_id): Promise<any> {
    return this.promosModel
      .deleteOne({
        _id: _id,
      })
      .then((data) => {
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
