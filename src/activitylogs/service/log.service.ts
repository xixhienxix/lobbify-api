import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import { Log, LogSchema } from '../models/log.model';

@Injectable({ scope: Scope.REQUEST })
export class LogService {
  private logModel: Model<Log>;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    const connection: Connection = (request as any).dbConnection;
    this.logModel =
      connection.models['Logs'] || connection.model('Logs', LogSchema);
  }

  async getLogsByUser(username: string) {
    try {
      return this.logModel
        .find({ username })
        .then((data) => {
          if (!data) return [];
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

  async postLogs(body: any) {
    try {
      const data = await this.logModel.create(body.logEntry);
      return data;
    } catch (err) {
      console.error('Error creating log entry', err);
      throw err;
    }
  }
}
