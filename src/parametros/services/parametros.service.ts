import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import { Parametros, ParametrosSchema } from '../models/parametros.model';
import { HotelSchedulerService } from 'src/scheduler/scheduler.tasks';
import { encryptSecret } from 'src/tenant/secret.utils'; // adjust path

@Injectable({ scope: Scope.REQUEST })
export class ParametrosService {
  private parametrosModel: Model<Parametros>;
  private readonly logger = new Logger(ParametrosService.name);

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    @Inject(forwardRef(() => HotelSchedulerService))
    private hotelSchedulerService: HotelSchedulerService,
  ) {
    const connection: Connection = (request as any).dbConnection;
    this.parametrosModel =
      connection.models['Parametros'] ||
      connection.model('Parametros', ParametrosSchema);
  }

  async getAll(
    role: string,
    restrictedFields: readonly string[],
  ): Promise<any> {
    const projection =
      role === 'ADMIN'
        ? {}
        : restrictedFields.reduce((acc, field) => ({ ...acc, [field]: 0 }), {});
    try {
      const data = await this.parametrosModel
        .findOne()
        .select(projection)
        .lean()
        .exec();

      if (!data) throw new NotFoundException('No parametros found');

      // Tell the UI whether a password exists without revealing it
      const withPass = await this.parametrosModel
        .findOne({ emailPass: { $exists: true, $nin: [null, ''] } })
        .select('_id')
        .lean()
        .exec();

      return { ...data, emailPassSet: !!withPass };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Database error fetching parametros: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch parametros configuration',
      );
    }
  }

  async getAllWithoutRole(): Promise<Parametros> {
    try {
      const data = await this.parametrosModel.findOne().lean().exec();

      if (!data) {
        throw new NotFoundException('No parametros found');
      }

      return data;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(
        `Database error fetching parametros: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        'Failed to fetch parametros configuration',
      );
    }
  }

  async getHotelParams(): Promise<Parametros> {
    try {
      const data = await this.parametrosModel.findOne().lean().exec();
      if (!data) throw new NotFoundException('No parametros found');
      return data;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Database error fetching parametros: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch parametros configuration',
      );
    }
  }

  async postParametros(body: any) {
    const hotelId = (this.request as any).hotelId;
    try {
      const { emailPass, emailPassSet, ...params } = body.parametros;

      // Keep the stored password unless a new one was sent
      const existing = await this.parametrosModel
        .findOne()
        .select('+emailPass')
        .lean()
        .exec();
      let storedPass: string | undefined = existing?.emailPass;

      if (typeof emailPass === 'string' && emailPass.trim()) {
        storedPass = encryptSecret(emailPass.replace(/\s+/g, ''));
      }
      // Clearing the email address also clears the password
      if (!params.emailUser?.trim()) storedPass = undefined;

      await this.parametrosModel.deleteOne({});
      const newParametros = new this.parametrosModel({
        ...params,
        ...(storedPass && { emailPass: storedPass }),
      });
      const data = await newParametros.save();

      await this.hotelSchedulerService.updateHotelSchedule(
        hotelId,
        params.checkOut,
      );

      const { emailPass: _omit, ...safe } = data.toObject();
      return safe;
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  async getPublicParametros(): Promise<Partial<Parametros>> {
    try {
      const data = await this.parametrosModel
        .findOne()
        .select({
          checkOut: 1,
          checkIn: 1,
          divisa: 1,
          zona: 1,
          codigoZona: 1,
          hotel: 1,
          wifi: 1,
          wifiPass: 1,
          infoAdicional: 1,
          urlMapa: 1,
          paginaWeb: 1,
          whatsapp: 1,
          ish: 1,
          clabe: 1,
          cuenta: 1,
          nombre_cuenta: 1,
        })
        .lean()
        .exec();

      if (!data) {
        throw new NotFoundException('No parametros found');
      }

      return data;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Database error fetching public parametros: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        'Failed to fetch public hotel configuration',
      );
    }
  }
}
