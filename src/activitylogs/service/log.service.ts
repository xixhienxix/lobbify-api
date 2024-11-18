import { Injectable } from '@nestjs/common';
import { Log } from '../models/log.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class LogService {
  constructor(@InjectModel('Log') private logModel: Model<Log>) {}

  async getLogsByUser(hotel: string, username: string) {
    try {
      return this.logModel
        .find({ hotel: hotel, username })
        .then((data) => {
          if (!data) {
            return [];
          }
          return data;
        })
        .catch((err) => {
          console.error('Error fetching logs:', err);
          throw err;
        });
    } catch (err) {
      console.error('Error fetching logs:', err);
      throw err;
    }
  }

  async postLogs(hotel: string, body: any) {
    console.log('Hotel', hotel);
    body.logEntry.hotel = hotel;
    try {
      const data = await this.logModel.create(body.logEntry);
      console.log('POST activity', data);
      return data;
    } catch (err) {
      console.error('Error creating log entry', err);
      throw err;
    }
  }
}
