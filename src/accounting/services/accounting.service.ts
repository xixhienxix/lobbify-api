import { BadRequestException, Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import { Edo_Cuenta, EdoCuentaSchema } from '../models/accounting.model';
import { huespeds, GuestSchema } from 'src/guests/models/guest.model';
import { AccountingGateway } from '../gateway/accounting.gateway';
import { DateTime } from 'luxon';

@Injectable({ scope: Scope.REQUEST })
export class AccountingService {
  private accountingModel: Model<Edo_Cuenta>;
  private guestModel: Model<huespeds>;

  constructor(
    private readonly accountingGateway: AccountingGateway,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    const connection: Connection = (request as any).dbConnection;

    this.accountingModel =
      connection.models['Edo_Cuenta'] ||
      connection.model('Edo_Cuenta', EdoCuentaSchema);

    this.guestModel =
      connection.models['Reservaciones'] ||
      connection.model('Reservaciones', GuestSchema);
  }

  private broadcast(data: any) {
    if (data) {
      this.accountingGateway.broadcastAccountingUpdate(data);
    }
  }

  async getAccounts(folio: string): Promise<Edo_Cuenta[]> {
    return this.accountingModel
      .find({ Folio: folio })
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }

  async getAccountsByDateRange(
    startDate: string,
    endDate: string,
    folio?: string,
  ): Promise<Edo_Cuenta[]> {
    const start = DateTime.fromISO(startDate, { setZone: true })
      .startOf('day')
      .toISO({ suppressTimezone: true });

    const end = DateTime.fromISO(endDate, { setZone: true })
      .endOf('day')
      .toISO({ suppressTimezone: true });

    const query: any = {
      Fecha: { $gte: start, $lte: end },
    };

    if (folio) {
      query.Folio = folio;
    }

    const results = await this.accountingModel.find(query);
    return results;
  }

  async addPayment(body: any): Promise<{ message: string; data: Edo_Cuenta }> {
    console.log('--- addPayment START ---');

    try {
      const edoCuenta = body.edoCuenta;
      const isDescuento = edoCuenta.Forma_de_Pago === 'Descuento';

      if (isDescuento) {
        delete edoCuenta.ID_Pago;

        if (
          !Array.isArray(edoCuenta.RelatedCuentas) ||
          edoCuenta.RelatedCuentas.length === 0
        ) {
          throw new Error('Descuento must have RelatedCuentas');
        }

        const relatedIds = edoCuenta.RelatedCuentas.map(
          (r: any) => r?._id,
        ).filter(Boolean);

        if (!relatedIds.length) {
          throw new Error('Invalid RelatedCuentas for Descuento');
        }

        await this.accountingModel.updateMany(
          { _id: { $in: relatedIds } },
          { $set: { Descuento_Aplicado: true } },
        );

        const descuentoEntry = await this.accountingModel.create(edoCuenta);
        this.broadcast(descuentoEntry);

        return { message: 'Descuento aplicado', data: descuentoEntry };
      }

      const isCargo = edoCuenta.Abono === 0 && edoCuenta.Cargo !== 0;

      if (isCargo) {
        delete edoCuenta.ID_Pago;
        const cargoEntry = await this.accountingModel.create(edoCuenta);
        this.broadcast(cargoEntry);
        return { message: 'Cargo creado', data: cargoEntry };
      }

      const pagoId = this.getPagoId(edoCuenta.ID_Pago);

      if (!pagoId) {
        throw new Error('Payment must contain a valid ID_Pago');
      }

      edoCuenta.ID_Pago = [pagoId];

      if (Array.isArray(edoCuenta.RelatedCuentas)) {
        edoCuenta.RelatedCuentas = edoCuenta.RelatedCuentas.map(
          ({ ID_Pago, ...rest }) => rest,
        );
      }

      const newEntry = await this.accountingModel.create(edoCuenta);

      if (edoCuenta.RelatedCuentas?.length > 0) {
        await Promise.all(
          edoCuenta.RelatedCuentas.map(async (rel: { _id: string }) => {
            await this.accountingModel.updateOne(
              { _id: rel._id, ID_Pago: { $type: 'array' } },
              { $addToSet: { ID_Pago: pagoId } },
            );
          }),
        );
      }

      this.broadcast(newEntry);
      return { message: 'Added', data: newEntry };
    } catch (err) {
      console.error('🔥 Error adding payment:', err);
      throw err;
    }
  }

  async addDscProperty(body: any) {
    const conceptos = body.conceptos || [];

    if (!Array.isArray(conceptos) || conceptos.length === 0) {
      return { message: 'Error al aplicar el descuento', updated: false };
    }

    const ids = conceptos.map((c) => c._id);

    const result = await this.accountingModel.updateMany(
      { _id: { $in: ids } },
      { $set: { Descuento_Aplicado: true } },
    );

    return {
      message: 'Descuentos aplicados correctamente',
      updated: result.modifiedCount,
    };
  }

  async addHospedaje(body: any): Promise<Edo_Cuenta[]> {
    const insertedDocumentArray: Edo_Cuenta[] = [];

    const edoCuentaArray = body.edoCuenta;

    try {
      for (const item of edoCuentaArray) {
        try {
          const existingDocument = await this.accountingModel.findOne({
            Folio: item.Folio,
          });

          if (existingDocument) {
            console.warn(`Document with Folio ${item.Folio} already exists.`);
            continue;
          }

          const createdDocument = await this.accountingModel.create(item);
          insertedDocumentArray.push(createdDocument);
        } catch (err) {
          console.error('Error processing item:', item, err);
          throw err;
        }
      }
    } catch (error) {
      console.error('Error inserting edoCuenta array:', error);
      throw error;
    }

    this.broadcast(insertedDocumentArray);
    return insertedDocumentArray;
  }

  async updatePaymentStatus(body: any): Promise<Edo_Cuenta | null> {
    const { _id, estatus, fechaCancelado, autorizo } = body;
    const edoCuenta = body.edoCuenta;
    const isDescuento = edoCuenta?.Forma_de_Pago === 'Descuento';

    const pagoId =
      !isDescuento &&
      Array.isArray(edoCuenta?.ID_Pago) &&
      edoCuenta.ID_Pago.length > 0
        ? edoCuenta.ID_Pago[0]
        : null;

    try {
      const updatedDoc = await this.accountingModel.findOneAndUpdate(
        { _id },
        {
          $set: {
            Estatus: estatus,
            Fecha_Cancelado: fechaCancelado,
            Autorizo: autorizo,
          },
          ...(pagoId && { $pull: { ID_Pago: pagoId } }),
        },
        { new: true },
      );

      if (!updatedDoc) return null;

      if (!isDescuento && pagoId) {
        await this.accountingModel.updateMany(
          { ID_Pago: { $type: 'array' } },
          { $pull: { ID_Pago: pagoId } },
        );
      }

      if (
        isDescuento &&
        estatus === 'Cancelado' &&
        Array.isArray(updatedDoc.RelatedCuentas) &&
        updatedDoc.RelatedCuentas.length > 0
      ) {
        const relatedIds = updatedDoc.RelatedCuentas.map(
          (c: any) => c?._id,
        ).filter(Boolean);

        if (relatedIds.length) {
          await this.accountingModel.updateMany(
            { _id: { $in: relatedIds } },
            { $set: { Descuento_Aplicado: false } },
          );
        }
      }

      this.broadcast(updatedDoc);
      return updatedDoc;
    } catch (err) {
      console.error('🔥 Error updating payment status:', err);
      throw err;
    }
  }

  async updateHospedaje(body: any): Promise<Edo_Cuenta[]> {
    try {
      const updateData = { ...body.edoCuenta, Fecha: body.edoCuenta.Fecha };

      const updatedEdoCuenta = await this.accountingModel.findOneAndUpdate(
        { Folio: body.folio },
        {
          $set: {
            Folio: updateData.Folio,
            Fecha: updateData.Fecha,
            Descripcion: updateData.Descripcion,
            Cargo: updateData.Cargo,
            Abono: updateData.Abono,
            Total: updateData.Total,
          },
        },
        { new: true },
      );

      if (updatedEdoCuenta) {
        this.broadcast(updatedEdoCuenta);
        return [updatedEdoCuenta];
      }
    } catch (err) {
      console.error('Error updating the payment:', err);
      throw new Error('Error updating the payment');
    }
  }

  async getAllAccounts(): Promise<Edo_Cuenta[]> {
    try {
      const data = await this.accountingModel.find().exec();
      return data || [];
    } catch (err) {
      console.error('Error fetching accounts:', err);
      throw err;
    }
  }

  async updateBalance(body: any): Promise<Edo_Cuenta[]> {
    return this.accountingModel
      .findOneAndUpdate({ Folio: body.folio }, { $set: { Cargo: body.monto } })
      .then((data) => {
        if (!data) return;
        this.broadcast(data);
        return data;
      })
      .catch((err) => err);
  }

  async actualizaTotales(body: any): Promise<any> {
    try {
      const data = await this.accountingModel.find({ Folio: body.folio });

      if (!data || data.length === 0) return [];

      const saldoPendiente = this.calculatePendiente(data);

      const updatedDocument = await this.guestModel.findOneAndUpdate(
        { folio: body.folio },
        { $set: { pendiente: saldoPendiente, porPagar: saldoPendiente } },
        { new: true },
      );

      if (updatedDocument) {
        this.broadcast(updatedDocument);
        return [updatedDocument];
      }

      return [];
    } catch (err) {
      console.error('Error:', err);
      return [];
    }
  }

  calculatePendiente(data: Edo_Cuenta[]): number {
    if (!data || data.length === 0) return 0;
    return data.reduce((acc, item) => {
      if (item?.Estatus === 'Cancelado') return acc;
      const cargo = item?.Cargo ?? 0;
      const abono = item?.Abono ?? 0;
      return acc + cargo - abono;
    }, 0);
  }

  private getPagoId(idPago: any): string | null {
    if (!Array.isArray(idPago)) return null;
    const validIds = idPago.filter(
      (id) => typeof id === 'string' && id.trim().length > 0,
    );
    return validIds.length > 0 ? validIds[validIds.length - 1] : null;
  }
}
