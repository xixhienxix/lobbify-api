import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import {
  huespeds,
  GuestSchema,
  Promesas,
  PromesasSchema,
  HuespedDetails,
  HuespedDetailsSchema,
} from '../models/guest.model';
import {
  estatus,
  EstatusSchema,
  Foliador,
  FoliadorSchema,
} from 'src/codes/_models/codes.model';
import { Bloqueos, BloqueosSchema } from 'src/bloqueos/_models/bloqueos.model';
import { DateTime } from 'luxon';
import { GuestGateway } from '../gateway/guest.gateway';

const reservationStatusMap: { [key: number]: string[] } = {
  1: ['Huesped en Casa', 'Walk-In', 'Reserva en Casa'],
  2: [
    'Reserva Sin Pago',
    'Reserva Confirmada',
    'Deposito Realizado',
    'Esperando Deposito',
    'Totalmente Pagada',
  ],
  4: ['Hizo Checkout', 'Check-Out'],
  5: ['Uso Interno'],
  6: ['Bloqueo'],
  7: ['Reserva Temporal'],
  8: ['No Show', 'Reserva Cancelada'],
};

@Injectable({ scope: Scope.REQUEST })
export class GuestService {
  private guestModel: Model<huespeds>;
  private foliadorModel: Model<Foliador>;
  private promesasModel: Model<Promesas>;
  private estatusModel: Model<estatus>;
  private bloqueosModel: Model<Bloqueos>;
  private huespedDetailsModel: Model<HuespedDetails>;

  constructor(
    private guestsGateway: GuestGateway,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    const connection: Connection = (request as any).dbConnection;

    this.guestModel =
      connection.models['Reservaciones'] ||
      connection.model('Reservaciones', GuestSchema);

    this.foliadorModel =
      connection.models['Foliador'] ||
      connection.model('Foliador', FoliadorSchema);

    this.promesasModel =
      connection.models['Promesas_Pago'] ||
      connection.model('Promesas_Pago', PromesasSchema);

    this.estatusModel =
      connection.models['Estatus'] ||
      connection.model('Estatus', EstatusSchema);

    this.bloqueosModel =
      connection.models['Bloqueo'] ||
      connection.model('Bloqueo', BloqueosSchema);

    this.huespedDetailsModel =
      connection.models['Detalles_Huesped'] ||
      connection.model('Detalles_Huesped', HuespedDetailsSchema);
  }

  async findAll(): Promise<huespeds[]> {
    return this.guestModel
      .find()
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async findByFolio(folio: string) {
    try {
      return await this.guestModel.findOne({ folio }).lean().exec();
    } catch (err) {
      console.error(`Error fetching folio ${folio}:`, err);
      throw err;
    }
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<huespeds[]> {
    const start = DateTime.fromISO(startDate, { setZone: true })
      .startOf('day')
      .toISO({ suppressTimezone: true });

    const end = DateTime.fromISO(endDate, { setZone: true })
      .endOf('day')
      .toISO({ suppressTimezone: true });

    return this.guestModel.find({
      llegada: { $lte: end },
      salida: { $gte: start },
    });
  }

  async roomUpdate(body: any): Promise<any> {
    return this.guestModel
      .findOneAndUpdate(
        { folio: body.folio },
        { $set: { numeroCuarto: body.numeroCuarto } },
        { new: true },
      )
      .catch((err) => err);
  }

  async findbyCode(code: string): Promise<huespeds[]> {
    return this.guestModel
      .find({ habitacion: code })
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async findbyCodeAndDate(
    code: string,
    filter: object = {},
  ): Promise<huespeds[]> {
    return this.guestModel.find({
      habitacion: code,
      $expr: {
        $gte: [{ $dateFromString: { dateString: '$salida' } }, new Date()],
      },
      ...filter,
    });
  }

  async onReservationResize(data: any): Promise<huespeds[]> {
    const resizeData = data.data;
    const huespedModificado = {
      folio: resizeData.folio,
      llegada: resizeData.StartTime,
      salida: resizeData.EndTime,
      noches: resizeData.stayNights,
      tarifa: resizeData.tarifaSeleccionada?.[0],
      porPagar: resizeData.totalSeleccionado,
      pendiente: resizeData.totalSeleccionado,
      habitacion: resizeData.cuarto,
      numeroCuarto: resizeData.numeroCuarto,
      desgloseEdoCuenta: resizeData.desgloseEdoCuenta,
    };
    return this.onModificaHuesped({ data: [huespedModificado] });
  }

  async onModificaHuesped(data: any): Promise<huespeds[]> {
    const huespedModificado = data.data[0];

    try {
      let shouldClearLateCheckout = false;

      if (huespedModificado.salida) {
        const dateCheck = await this.guestModel.aggregate([
          {
            $project: {
              parsedSalida: {
                $dateFromString: { dateString: huespedModificado.salida },
              },
              now: '$$NOW',
            },
          },
          {
            $project: {
              salidaYear: { $year: '$parsedSalida' },
              salidaMonth: { $month: '$parsedSalida' },
              salidaDay: { $dayOfMonth: '$parsedSalida' },
              nowYear: { $year: '$now' },
              nowMonth: { $month: '$now' },
              nowDay: { $dayOfMonth: '$now' },
            },
          },
          {
            $project: {
              salidaYear: 1,
              salidaMonth: 1,
              salidaDay: 1,
              nowYear: 1,
              nowMonth: 1,
              nowDay: 1,
              isFuture: {
                $or: [
                  { $gt: ['$salidaYear', '$nowYear'] },
                  {
                    $and: [
                      { $eq: ['$salidaYear', '$nowYear'] },
                      { $gt: ['$salidaMonth', '$nowMonth'] },
                    ],
                  },
                  {
                    $and: [
                      { $eq: ['$salidaYear', '$nowYear'] },
                      { $eq: ['$salidaMonth', '$nowMonth'] },
                      { $gt: ['$salidaDay', '$nowDay'] },
                    ],
                  },
                ],
              },
            },
          },
          { $limit: 1 },
        ]);

        shouldClearLateCheckout = dateCheck.length > 0 && dateCheck[0].isFuture;
      }

      const updateObject = { ...huespedModificado };
      if (shouldClearLateCheckout) updateObject.lateCheckOut = '';

      const updatedHuesped = await this.guestModel.findOneAndUpdate(
        { folio: huespedModificado.folio },
        { $set: updateObject },
        { new: true },
      );

      this.guestsGateway.broadcastGuestsUpdate();
      return updatedHuesped ? [updatedHuesped] : [];
    } catch (err) {
      console.error('❌ Error updating guest:', err);
      throw new Error('Error updating the guest');
    }
  }

  async getDisponibilidad(params: any): Promise<any> {
    const busqueda = params.params;
    const t0 = Date.now();

    const initial = DateTime.fromISO(busqueda.initialDate, {
      zone: 'America/Mexico_City',
    });
    const end = DateTime.fromISO(busqueda.endDate, {
      zone: 'America/Mexico_City',
    });
    const initialDayStart = initial.startOf('day');

    const sinDisponibilidad: string[] = [];

    const docs = await this.guestModel
      .find({
        $or: [
          {
            llegada: {
              $gte: initial.toUTC().toISO(),
              $lt: end.toUTC().toISO(),
            },
          },
          {
            salida: { $gt: initial.toUTC().toISO(), $lte: end.toUTC().toISO() },
          },
          {
            llegada: { $lt: initial.toUTC().toISO() },
            salida: { $gt: end.toUTC().toISO() },
          },
        ],
        estatus: {
          $in: [
            ...reservationStatusMap[1],
            ...reservationStatusMap[2],
            ...reservationStatusMap[5],
            ...reservationStatusMap[6],
          ],
          $nin: [
            ...reservationStatusMap[4],
            ...reservationStatusMap[8],
            ...reservationStatusMap[7],
          ],
        },
      })
      .catch((err) => err);

    if (!Array.isArray(docs)) return [];

    for (const doc of docs) {
      const d = doc._doc ?? doc;
      const salida = DateTime.fromISO(d.salida, {
        zone: 'America/Mexico_City',
      });
      const isSameDay =
        salida.startOf('day').toMillis() === initialDayStart.toMillis();
      if (!isSameDay) sinDisponibilidad.push(d.numeroCuarto);
    }

    const bloqueosDocs = await this.bloqueosModel
      .find({
        $and: [
          {
            $or: [
              {
                Desde: { $lte: end.toUTC().toISO() },
                Hasta: { $gte: initial.toUTC().toISO() },
              },
              { Hasta: { $eq: end.toUTC().toISO() } },
            ],
          },
          { Completed: false },
          {
            $or: [
              { 'Estatus.sinLlegadas': true },
              { 'Estatus.fueraDeServicio': true },
            ],
          },
        ],
      })
      .exec();

    for (const b of bloqueosDocs) {
      if (b.Cuarto && Array.isArray(b.Cuarto)) {
        sinDisponibilidad.push(...b.Cuarto);
      }
    }

    console.log(
      `[END] Total sin disponibilidad: ${sinDisponibilidad.length} | tiempo: ${
        Date.now() - t0
      }ms`,
    );
    return sinDisponibilidad;
  }

  async postReservation(body: any): Promise<any> {
    const huespedArr = body.huespedInfo;
    const addedDocuments: any[] = [];

    if (!huespedArr || huespedArr.length === 0) {
      return { message: 'No hay información de huespedes para procesar' };
    }

    const firstFolio = huespedArr[0]?.folio ?? '';
    const letra = firstFolio.charAt(0);

    if (!huespedArr.every((h) => h.folio.charAt(0) === letra)) {
      return { message: 'Los folios no comparten la misma letra inicial' };
    }

    const maxFolioNumber = Math.max(
      ...huespedArr.map((h) => parseInt(h.folio.substring(1), 10)),
    );

    const updatePromises = huespedArr.map(async (element) => {
      try {
        const data = await this.guestModel.create(element);
        if (!data) return { message: 'No se pudo crear la reserva' };
        addedDocuments.push(data);
        return { message: 'Habitación creada con éxito' };
      } catch (err) {
        console.log('Error creating guest:', err);
        return { message: 'Error al crear la reserva', error: err };
      }
    });

    await Promise.all(updatePromises);

    try {
      const foliadorUpdateResult = await this.foliadorModel.findOneAndUpdate(
        { Letra: letra },
        { Folio: `${maxFolioNumber + 1}` },
        { new: true },
      );

      if (!foliadorUpdateResult) {
        return { message: 'No se pudo actualizar el folio', addedDocuments };
      }

      this.guestsGateway.broadcastGuestsUpdate();
      return { message: 'Folio actualizado con éxito', addedDocuments };
    } catch (err) {
      console.log('Error updating foliador:', err);
      return { message: 'Error al actualizar el folio', error: err };
    }
  }

  async updateHuesped(body: any): Promise<huespeds[]> {
    return this.guestModel
      .findOneAndUpdate(
        { folio: body.huesped.folio },
        {
          $set: {
            estatus: body.huesped.estatus,
            noches: body.huesped.noches,
            numeroCuarto: body.huesped.numeroCuarto,
            llegada: body.huesped.llegada,
            salida: body.huesped.salida,
            habitacion: body.huesped.habitacion,
            tarifa: body.huesped.tarifa,
            pendiente: body.huesped.pendiente,
            porPagar: body.huesped.porPagar,
            tipoHuesped: body.huesped.tipoHuesped,
            nombre: body.huesped.nombre,
            email: body.huesped.email,
            telefono: body.huesped.telefono,
            notas: body.huesped.notas,
            ID_Socio: body.huesped.ID_Socio,
          },
        },
      )
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async findPromesas(folio: any): Promise<huespeds[]> {
    return this.promesasModel
      .find({ Folio: folio })
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async updateStatus(body: any): Promise<huespeds[]> {
    return this.guestModel
      .findOneAndUpdate(
        { folio: body.huesped.folio },
        {
          $set: {
            estatus_Ama_De_Llaves: body.huesped.estatus_Ama_De_Llaves,
            llegada: body.huesped.llegada,
            salida: body.huesped.salida,
            tarifa: body.huesped.tarifa,
            numeroCuarto: body.huesped.numeroCuarto,
            habitacion: body.huesped.habitacion,
            notas: body.huesped.notas,
            estatus: body.huesped.estatus,
            desgloseEdoCuenta: body.huesped.desgloseEdoCuenta,
          },
        },
      )
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async getDetails(): Promise<HuespedDetails[]> {
    return this.huespedDetailsModel
      .find()
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async getDetailsById(folio: string): Promise<HuespedDetails[]> {
    return this.huespedDetailsModel
      .findOne({ ID_Socio: folio })
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async postDetails(body: any): Promise<HuespedDetails[]> {
    return this.huespedDetailsModel
      .findOneAndUpdate(
        { ID_Socio: body.huesped.ID_Socio },
        {
          $set: {
            ID_Socio: body.huesped.ID_Socio,
            Nombre: body.huesped.Nombre,
            email: body.huesped.email,
            telefono: body.huesped.telefono,
            tipoHuesped: body.huesped.tipoHuesped,
            fechaNacimiento: body.huesped.fechaNacimiento
              ? new Date(
                  body.huesped.fechaNacimiento.year,
                  body.huesped.fechaNacimiento.month - 1,
                  body.huesped.fechaNacimiento.day,
                )
              : null,
            trabajaEn: body.huesped.trabajaEn,
            tipoDeID: body.huesped.tipoDeID,
            numeroDeID: body.huesped.numeroDeID,
            direccion: body.huesped.direccion,
            pais: body.huesped.pais,
            ciudad: body.huesped.ciudad,
            codigoPostal: body.huesped.codigoPostal,
            lenguaje: body.huesped.lenguaje,
            notas: body.huesped.notas,
            cfdi: body.huesped.cfdi,
            razon_social: body.huesped.razon_social,
            rfc: body.huesped.rfc,
            modelo: body.huesped.modelo,
            type_Auto: body.huesped.type_Auto,
            placa: body.huesped.placa,
            color_Auto: body.huesped.color_Auto,
          },
        },
        { upsert: true },
      )
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async updateEstatusHuesped(body: any): Promise<any> {
    let estatusActualizado = body.estatus;
    switch (body.estatus) {
      case '1':
        estatusActualizado = 'Huesped en Casa';
        break;
      case '2':
        estatusActualizado = 'Reserva Sin Pago';
        break;
      case '3':
        estatusActualizado = 'Reserva Confirmada';
        break;
      case '4':
        estatusActualizado = 'Check-Out';
        return this.guestModel
          .updateOne(
            { folio: body.huesped.folio },
            {
              $set: {
                estatus: estatusActualizado,
                pendiente: body.huesped.pendiente,
                porPagar: body.huesped.porPagar,
                noches: body.huesped.noches,
              },
            },
          )
          .then((data) => {
            if (!data) return;
            return data;
          })
          .catch((err) => err);
      case '5':
        estatusActualizado = 'Uso Interno';
        break;
      case '6':
        estatusActualizado = 'Bloqueo / Sin Llegadas';
        break;
      case '7':
        estatusActualizado = 'Reserva Temporal';
        break;
      case '8':
        estatusActualizado = 'Esperando Deposito';
        break;
      case '9':
        estatusActualizado = 'Deposito Realizado';
        break;
      case '10':
        estatusActualizado = 'Totalmente Pagada';
        break;
      case '11':
        estatusActualizado = 'No Show';
        break;
      case '12':
        estatusActualizado = 'Reserva Cancelada';
        break;
    }

    return this.guestModel
      .updateOne(
        { folio: body.huesped.folio },
        { $set: { estatus: estatusActualizado } },
      )
      .then((data) => {
        if (data.modifiedCount > 0) return data;
        return;
      })
      .catch((err) => {
        throw err;
      });
  }

  async searchByFilter(filters: any) {
    const { llegada, salida, numeroCuarto, habitacion, estatus, amaDesc } =
      filters;

    const matchStage: any = {};

    if (estatus) matchStage.estatus = estatus;
    if (habitacion) matchStage.tipoHab = habitacion;
    if (amaDesc) matchStage['housekeeping.Descripcion'] = amaDesc;
    if (numeroCuarto) matchStage.numeroCuarto = numeroCuarto;
    if (llegada && salida) {
      matchStage.llegada = { $gte: new Date(llegada) };
      matchStage.salida = { $lte: new Date(salida) };
    }

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'Ama_De_Llaves',
          localField: 'roomStatus',
          foreignField: 'Descripcion',
          as: 'housekeeping',
        },
      },
      { $unwind: { path: '$housekeeping', preserveNullAndEmptyArrays: true } },
    ];

    if (Object.keys(matchStage).length > 0) {
      pipeline.unshift({ $match: matchStage });
    }

    pipeline.push({ $sort: { checkin: 1 } });

    return this.guestModel.aggregate(pipeline);
  }

  async getReservationSummary() {
    const reservations = await this.guestModel.find().lean();
    const currentDate = DateTime.local().setZone('America/Mexico_City');
    const todayDateString = currentDate.toISODate();
    const isToday = (date: string) =>
      DateTime.fromISO(date).hasSame(currentDate, 'day');

    const resumen = { llegadas: [], salidas: [], colgados: [], noShow: [] };

    for (const h of reservations) {
      if (isToday(h.llegada) && reservationStatusMap[2].includes(h.estatus))
        resumen.llegadas.push(h);
      if (
        isToday(h.salida) &&
        (reservationStatusMap[1].includes(h.estatus) ||
          reservationStatusMap[4].includes(h.estatus))
      )
        resumen.salidas.push(h);
      if (
        DateTime.fromISO(h.salida).toISODate() <= todayDateString &&
        reservationStatusMap[1].includes(h.estatus)
      )
        resumen.colgados.push(h);
      if (reservationStatusMap[8].includes(h.estatus)) resumen.noShow.push(h);
    }

    return resumen;
  }

  async findTodayLateCheckouts(cutoffTime = '12:00') {
    const [cutoffHours, cutoffMinutes] = cutoffTime.split(':').map(Number);
    const now = new Date();

    return this.guestModel.aggregate([
      {
        $match: {
          estatus: 'Huesped en Casa',
          lateCheckOut: { $ne: 'Colgado' },
        },
      },
      {
        $addFields: {
          salidaDate: {
            $cond: {
              if: { $eq: [{ $type: '$salida' }, 'string'] },
              then: { $dateFromString: { dateString: '$salida' } },
              else: '$salida',
            },
          },
        },
      },
      {
        $addFields: {
          salidaYear: { $year: '$salidaDate' },
          salidaMonth: { $month: '$salidaDate' },
          salidaDay: { $dayOfMonth: '$salidaDate' },
          salidaTotalMinutes: {
            $add: [
              { $multiply: [{ $hour: '$salidaDate' }, 60] },
              { $minute: '$salidaDate' },
            ],
          },
        },
      },
      {
        $match: {
          $or: [
            {
              $expr: {
                $or: [
                  { $lt: ['$salidaYear', now.getFullYear()] },
                  {
                    $and: [
                      { $eq: ['$salidaYear', now.getFullYear()] },
                      { $lt: ['$salidaMonth', now.getMonth() + 1] },
                    ],
                  },
                  {
                    $and: [
                      { $eq: ['$salidaYear', now.getFullYear()] },
                      { $eq: ['$salidaMonth', now.getMonth() + 1] },
                      { $lt: ['$salidaDay', now.getDate()] },
                    ],
                  },
                ],
              },
            },
            {
              $expr: {
                $and: [
                  { $eq: ['$salidaYear', now.getFullYear()] },
                  { $eq: ['$salidaMonth', now.getMonth() + 1] },
                  { $eq: ['$salidaDay', now.getDate()] },
                  {
                    $gt: [
                      '$salidaTotalMinutes',
                      cutoffHours * 60 + cutoffMinutes,
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $project: {
          salidaDate: 0,
          salidaYear: 0,
          salidaMonth: 0,
          salidaDay: 0,
          salidaTotalMinutes: 0,
        },
      },
    ]);
  }

  async updateColgadoStatus(body: {
    huesped: { folio: string };
  }): Promise<{ matched: number; modified: number }> {
    const folio = body?.huesped?.folio;
    if (!folio) throw new Error('Folio is required to update Colgado status');

    const { matchedCount, modifiedCount } = await this.guestModel.updateMany(
      { folio },
      { $set: { lateCheckOut: 'Colgado' } },
    );

    return { matched: matchedCount, modified: modifiedCount };
  }

  async updateLateCheckOutStatus(reservationsFolios: string[]) {
    if (reservationsFolios.length === 0)
      return { modifiedCount: 0, matchedCount: 0 };

    try {
      return await this.guestModel.updateMany(
        { folio: { $in: reservationsFolios } },
        { $set: { lateCheckOut: 'Late Check-Out' } },
      );
    } catch (err) {
      console.error('❌ Late checkout update failed:', err);
      throw err;
    }
  }
}
