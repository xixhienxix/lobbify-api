import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HuespedDetails, Promesas, huespeds } from '../models/guest.model';
import { estatus, Foliador } from 'src/codes/_models/codes.model';
import { Bloqueos } from 'src/bloqueos/_models/bloqueos.model';
import { DateTime } from 'luxon';

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
@Injectable()
export class GuestService {
  constructor(
    @InjectModel(huespeds.name) private guestModel: Model<huespeds>,
    @InjectModel('Foliador') private readonly foliadorModel: Model<Foliador>,
    @InjectModel('Promesas') private readonly promesasModel: Model<Promesas>,
    @InjectModel('Estatus') private readonly estatusModel: Model<estatus>,
    @InjectModel('Bloqueos') private readonly bloqueosModel: Model<Bloqueos>, // Ensure the name matches
    @InjectModel('Detalles_Huesped')
    private readonly huespedDetailsModel: Model<HuespedDetails>,
  ) {}

  async findAll(hotel: string): Promise<huespeds[]> {
    return this.guestModel
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

  async findbyCode(hotel: string, code: string): Promise<huespeds[]> {
    return this.guestModel
      .find({ habitacion: code, hotel: hotel })
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

  async findbyCodeAndDate(
    hotel: string,
    code: string,
    filter: object = {}, // Optional filter
  ): Promise<huespeds[]> {
    return this.guestModel.find({
      hotel: hotel,
      habitacion: code,
      $expr: {
        $gte: [
          {
            $dateFromString: {
              dateString: '$salida',
            },
          },
          new Date(),
        ],
      },
      ...filter, // Merge the additional filter
    });
  }

  async onReservationResize(hotel: string, data: any): Promise<huespeds[]> {
    return this.guestModel
      .findOneAndUpdate(
        { folio: data.data.folio, hotel: hotel },
        {
          $set: {
            llegada: data.data.StartTime,
            salida: data.data.EndTime,
            noches: data.data.stayNights,
            tarifa: data.data.tarifaSeleccionada[0],
            porPagar: data.data.totalSeleccionado,
            pendiente: data.data.totalSeleccionado,
            habitacion: data.data.cuarto,
            numeroCuarto: data.data.numeroCuarto,
            desgloseEdoCuenta: data.data.desgloseEdoCuenta,
          },
        },
      )
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

  async onModificaHuesped(hotel: string, data: any): Promise<huespeds[]> {
    const huespedModificado = data.data[0];

    try {
      const updatedHuesped = await this.guestModel.findOneAndUpdate(
        { folio: huespedModificado.folio, hotel: hotel },
        {
          $set: {
            ...huespedModificado,
          },
        },
        { new: true }, // This option ensures the modified document is returned
      );

      return updatedHuesped ? [updatedHuesped] : [];
    } catch (err) {
      console.error(err);
      throw new Error('Error updating the guest');
    }
  }

  async getDisponibilidad(hotel: string, params: any): Promise<any> {
    console.log('hotel:', hotel);
    console.log('params:', params);

    const t0 = Date.now();
    const busqueda = params.params;

    // --- Marcas de tiempo usando Luxon con zona 'America/Mexico_City'
    const initial = DateTime.fromISO(busqueda.initialDate, {
      zone: 'America/Mexico_City',
    });
    const end = DateTime.fromISO(busqueda.endDate, {
      zone: 'America/Mexico_City',
    });

    const initialDayStart = initial.startOf('day');
    const initialDayEnd = initialDayStart.plus({ days: 1 });

    console.log(
      '[BOUNDARIES]',
      '\n initial (raw):',
      initial.toString(),
      '\n initial ISO :',
      initial.toISO(),
      ' | epoch:',
      initial.toMillis(),
      '\n end (raw)    :',
      end.toString(),
      '\n end ISO      :',
      end.toISO(),
      ' | epoch:',
      end.toMillis(),
      '\n initialDayStart:',
      initialDayStart.toString(),
      'ISO:',
      initialDayStart.toISO(),
      '\n initialDayEnd  :',
      initialDayEnd.toString(),
      'ISO:',
      initialDayEnd.toISO(),
    );

    const sinDisponibilidad: string[] = [];
    console.log(`[${DateTime.now().toISO()}] [START] getDisponibilidad`);

    // --- Query de disponibilidad usando fechas en UTC
    const dispoquery = this.guestModel
      .find({
        hotel,
        $or: [
          {
            llegada: {
              $gte: initial.toUTC().toISO(),
              $lt: end.toUTC().toISO(),
            },
          }, // C1
          {
            salida: { $gt: initial.toUTC().toISO(), $lte: end.toUTC().toISO() },
          }, // C2
          {
            llegada: { $lt: initial.toUTC().toISO() },
            salida: { $gt: end.toUTC().toISO() },
          }, // C3
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

    const docs = await dispoquery;
    if (!Array.isArray(docs)) {
      console.error(
        '[ERROR] dispoquery devolvió algo que NO es un array:',
        docs,
      );
      return [];
    }

    console.log(`[QUERY] docs encontrados: ${docs.length}`);

    // --- Itera y explica por qué cada doc entra / si lo agregas o no
    for (let i = 0; i < docs.length; i++) {
      const d = docs[i]._doc ?? docs[i];
      const llegada = DateTime.fromISO(d.llegada, {
        zone: 'America/Mexico_City',
      });
      const salida = DateTime.fromISO(d.salida, {
        zone: 'America/Mexico_City',
      });

      const c1 =
        llegada.toMillis() >= initial.toMillis() &&
        llegada.toMillis() < end.toMillis();
      const c2 =
        salida.toMillis() > initial.toMillis() &&
        salida.toMillis() <= end.toMillis();
      const c3 =
        llegada.toMillis() < initial.toMillis() &&
        salida.toMillis() > end.toMillis();

      const salidaNorm = salida.startOf('day');
      const initialNorm = initialDayStart;
      const isSameDay = salidaNorm.toMillis() === initialNorm.toMillis();

      const shouldPush = !isSameDay;

      console.log(
        `[DOC ${i}] #${d.numeroCuarto} | estatus=${d.estatus}`,
        `\n  llegada: ${llegada.toString()} | ISO: ${llegada.toISO()} | epoch: ${llegada.toMillis()}`,
        `\n  salida : ${salida.toString()}  | ISO: ${salida.toISO()} | epoch: ${salida.toMillis()}`,
        `\n  C1=${c1} C2=${c2} C3=${c3}  (por esto el query lo trajo)`,
        `\n  same-day? (salida vs initial) -> ${isSameDay} (salidaNorm=${salidaNorm.toISO()} vs initialNorm=${initialNorm.toISO()})`,
        `\n  *** agregar a sinDisponibilidad? ${shouldPush} ***`,
      );

      if (shouldPush) {
        sinDisponibilidad.push(d.numeroCuarto);
      }
    }

    // --- Resumen por cuarto (duplicados etc.)
    const freq: Record<string, number> = {};
    for (const q of sinDisponibilidad) freq[q] = (freq[q] || 0) + 1;
    console.log(
      '[RESUMEN] Cuartos marcados sin disponibilidad (frecuencia):',
      freq,
    );

    // --- Bloqueos
    const bloqueosQuery = this.bloqueosModel
      .find({
        hotel: 'Hotel Pokemon',
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

    const bloqueosDocs = await bloqueosQuery;
    console.log(`[BLOQUEOS] docs encontrados: ${bloqueosDocs.length}`);
    for (let j = 0; j < bloqueosDocs.length; j++) {
      const b = bloqueosDocs[j];
      const desde = DateTime.fromISO(b.Desde, { zone: 'America/Mexico_City' });
      const hasta = DateTime.fromISO(b.Hasta, { zone: 'America/Mexico_City' });
      const toca = !(
        hasta.toMillis() < initial.toMillis() ||
        desde.toMillis() > end.toMillis()
      );

      console.log(
        `[BLOQ ${j}] Cuartos=${JSON.stringify(b.Cuarto)} | sinLlegadas=${
          b?.Estatus?.sinLlegadas
        } | fueraDeServicio=${b?.Estatus?.fueraDeServicio}`,
        `\n  Desde: ${desde.toString()} (${desde.toISO()})  Hasta: ${hasta.toString()} (${hasta.toISO()})`,
        `\n  ¿toca ventana? ${toca}`,
      );

      if (b.Cuarto && Array.isArray(b.Cuarto)) {
        sinDisponibilidad.push(...b.Cuarto);
      }
    }

    console.log(
      `[END] Total marcados sin disponibilidad: ${
        sinDisponibilidad.length
      } | tiempo: ${Date.now() - t0}ms`,
    );

    return sinDisponibilidad;
  }

  async postReservation(hotel: string, body: any): Promise<any> {
    const huespedArr = body.huespedInfo;
    const addedDocuments: any[] = [];

    if (!huespedArr || huespedArr.length === 0) {
      return { message: 'No hay información de huespedes para procesar' };
    }

    // Get the letter from the first folio
    const firstFolio = huespedArr[0]?.folio ?? '';
    const letra = firstFolio.charAt(0);

    // Validate all folios share the same letter
    if (!huespedArr.every((huesped) => huesped.folio.charAt(0) === letra)) {
      return { message: 'Los folios no comparten la misma letra inicial' };
    }

    // Find the maximum folio number in the huespedArr
    const maxFolioNumber = Math.max(
      ...huespedArr.map((huesped) => parseInt(huesped.folio.substring(1), 10)),
    );

    const filter = { hotel: hotel, Letra: letra };

    // Map through huespedArr to create records for each guest
    const updatePromises = huespedArr.map(async (element) => {
      const huesped = { ...element, hotel };
      try {
        const data = await this.guestModel.create(huesped);
        if (!data) {
          return { message: 'No se pudo crear la reserva, intente más tarde' };
        }
        addedDocuments.push(data);
        return { message: 'Habitación creada con éxito' };
      } catch (err) {
        console.log('Error creating guest:', err);
        return { message: 'Error al crear la reserva', error: err };
      }
    });

    // Wait for all guest creation operations to complete
    await Promise.all(updatePromises);

    // Calculate the new folio number for the Foliador
    const newFolioNumber = maxFolioNumber + 1;
    const update = { Folio: `${newFolioNumber}` };

    // Update the Foliador in the database
    try {
      const foliadorUpdateResult = await this.foliadorModel.findOneAndUpdate(
        filter,
        update,
        { new: true },
      );
      if (!foliadorUpdateResult) {
        return {
          message: 'No se pudo actualizar el folio, intente más tarde',
          addedDocuments,
        };
      }
      return { message: 'Folio actualizado con éxito', addedDocuments };
    } catch (err) {
      console.log('Error updating foliador:', err);
      return { message: 'Error al actualizar el folio', error: err };
    }
  }

  // Huesped

  async updateHuesped(hotel: string, body: any): Promise<huespeds[]> {
    return this.guestModel
      .findOneAndUpdate(
        { folio: body.huesped.folio, hotel: hotel },
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

  //PROMESAS

  async findPromesas(hotel: string, folio: any): Promise<huespeds[]> {
    return this.promesasModel
      .find({ Folio: folio, hotel: hotel })
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

  async updateStatus(hotel: string, body: any): Promise<huespeds[]> {
    return this.guestModel
      .findOneAndUpdate(
        { folio: body.huesped.folio, hotel: hotel },
        {
          $set: {
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

  // HUESPED DETAILS

  async getDetails(hotel: string): Promise<HuespedDetails[]> {
    return this.huespedDetailsModel
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

  async getDetailsById(
    hotel: string,
    folio: string,
  ): Promise<HuespedDetails[]> {
    return this.huespedDetailsModel
      .findOne({ ID_Socio: folio, hotel: hotel })
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

  async postDetails(hotel: string, body: any): Promise<HuespedDetails[]> {
    return this.huespedDetailsModel
      .findOneAndUpdate(
        {
          ID_Socio: body.huesped.ID_Socio,
          hotel: hotel,
        },
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
          },
        },
        { upsert: true },
      )
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

  async updateEstatusHuesped(hotel: string, body: any): Promise<any> {
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
                hotel: hotel,
              },
            },
          )
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
        break;
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
        { folio: body.huesped.folio, hotel: hotel },
        { $set: { estatus: estatusActualizado } },
      )
      .then((data) => {
        if (data.modifiedCount > 0) {
          return data;
        } else {
          return;
        }
      })
      .catch((err) => {
        console.error('Update failed:', err);
        throw err; // Re-throw the error to handle it further up the chain if needed
      });
  }
}
