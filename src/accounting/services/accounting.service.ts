import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Edo_Cuenta } from '../models/accounting.model';
import { huespeds } from 'src/guests/models/guest.model';
import { AccountingGateway } from '../gateway/accounting.gateway';
import { DateTime } from 'luxon';
@Injectable()
export class AccountingService {
  constructor(
    private readonly accountingGateway: AccountingGateway,

    @InjectModel('Edo_Cuenta')
    private readonly accountingModel: Model<Edo_Cuenta>,

    @InjectModel(huespeds.name)
    private readonly guestModel: Model<huespeds>,
  ) {}

  // Helper to avoid Duplicate Calls
  private broadcast(data: any) {
    if (data) {
      this.accountingGateway.broadcastAccountingUpdate(data);
    }
  }

  async getAccounts(hotel: string, folio: string): Promise<Edo_Cuenta[]> {
    return this.accountingModel
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

  async getAccountsByDateRange(
    hotel: string,
    startDate: string,
    endDate: string,
    folio?: string,
  ): Promise<Edo_Cuenta[]> {
    // Build pure local ISO strings (NO timezone, NO UTC shift)
    const start = DateTime.fromISO(startDate, { setZone: true })
      .startOf('day')
      .toISO({ suppressTimezone: true });

    const end = DateTime.fromISO(endDate, { setZone: true })
      .endOf('day')
      .toISO({ suppressTimezone: true });

    const query: any = {
      hotel,
      Fecha: { $gte: start, $lte: end },
    };

    if (folio) {
      query.Folio = folio;
    }

    console.log('Mongo Query:', JSON.stringify(query, null, 2));

    const results = await this.accountingModel.find(query);
    console.log('Results Count:', results.length);

    return results;
  }

  async addPayment(
    hotel: string,
    body: any,
  ): Promise<{ message: string; data: Edo_Cuenta }> {
    console.log('--- addPayment START ---');
    console.log('body....', body);

    body.edoCuenta.hotel = hotel;

    try {
      const edoCuenta = body.edoCuenta;
      const isDescuento = edoCuenta.Forma_de_Pago === 'Descuento';

      /**
       * ============================
       * 🏷️ DESCUENTO FLOW
       * ============================
       */
      if (isDescuento) {
        console.log('🏷️ Processing DESCUENTO');

        // ❌ Descuento NEVER has ID_Pago
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

        // ✅ Mark cargos as discounted
        await this.accountingModel.updateMany(
          {
            _id: { $in: relatedIds },
            hotel,
          },
          {
            $set: { Descuento_Aplicado: true },
          },
        );

        // ✅ Create descuento record
        const descuentoEntry = await this.accountingModel.create(edoCuenta);

        this.broadcast(descuentoEntry);

        console.log('✅ Descuento applied');
        console.log('--- addPayment END ---');

        return {
          message: 'Descuento aplicado',
          data: descuentoEntry,
        };
      }

      /**
       * ============================
       * 💳 PAYMENT FLOW
       * ============================
       */

      const pagoId = this.getPagoId(edoCuenta.ID_Pago);

      if (!pagoId) {
        throw new Error('Payment must contain a valid ID_Pago');
      }

      // 🔒 Enforce single ID
      edoCuenta.ID_Pago = [pagoId];

      /**
       * Strip ID_Pago from RelatedCuentas
       */
      if (Array.isArray(edoCuenta.RelatedCuentas)) {
        edoCuenta.RelatedCuentas = edoCuenta.RelatedCuentas.map(
          ({ ID_Pago, ...rest }) => rest,
        );
      }

      console.log('💳 Final Payment ID_Pago:', edoCuenta.ID_Pago);

      /**
       * Create payment record
       */
      const newEntry = await this.accountingModel.create(edoCuenta);

      /**
       * Push pagoId into related cargos
       */
      if (edoCuenta.RelatedCuentas?.length > 0) {
        await Promise.all(
          edoCuenta.RelatedCuentas.map(async (rel: { _id: string }) => {
            const result = await this.accountingModel.updateOne(
              {
                _id: rel._id,
                ID_Pago: { $type: 'array' },
              },
              {
                $addToSet: { ID_Pago: pagoId },
              },
            );

            console.log(
              `🧾 Cargo ${rel._id} — matched: ${result.matchedCount}, modified: ${result.modifiedCount}`,
            );
          }),
        );
      }

      this.broadcast(newEntry);

      console.log('📡 Broadcast sent');
      console.log('--- addPayment END ---');

      return {
        message: 'Added',
        data: newEntry,
      };
    } catch (err) {
      console.error('🔥 Error adding payment:', err);
      throw err;
    }
  }

  async addDscProperty(hotel: string, body: any) {
    const conceptos = body.conceptos || [];

    if (!Array.isArray(conceptos) || conceptos.length === 0) {
      return {
        message: 'Error al aplicar el descuento',
        updated: false,
      };
    }

    const ids = conceptos.map((c) => c._id);

    const result = await this.accountingModel.updateMany(
      {
        _id: { $in: ids },
        hotel: hotel,
      },
      {
        $set: { Descuento_Aplicado: true },
      },
    );

    return {
      message: 'Descuentos aplicados correctamente',
      updated: result.modifiedCount,
    };
  }

  async addHospedaje(hotel: string, body: any): Promise<Edo_Cuenta[]> {
    const insertedDocumentArray: Edo_Cuenta[] = [];

    // Attach the hotel property to each edoCuenta item
    const edoCuentaArray = body.edoCuenta.map((item: any) => ({
      ...item,
      hotel, // Add the hotel name to each item
    }));

    try {
      // Insert each document and ensure uniqueness
      for (const item of edoCuentaArray) {
        try {
          // Check if the document already exists to prevent duplicates
          const existingDocument = await this.accountingModel.findOne({
            Folio: item.Folio, // Check by unique identifier (e.g., Folio)
          });

          if (existingDocument) {
            console.warn(`Document with Folio ${item.Folio} already exists.`);
            continue; // Skip to the next item
          }

          // Create the document in the database
          const createdDocument = await this.accountingModel.create(item);

          // Push the created document to the result array
          insertedDocumentArray.push(createdDocument);
        } catch (err) {
          console.error('Error processing item:', item, err);
          throw err; // Rethrow the error for external handling
        }
      }
    } catch (error) {
      console.error('Error inserting edoCuenta array:', error);
      throw error; // Re-throw the error to the caller
    }
    this.broadcast(insertedDocumentArray);

    return insertedDocumentArray;
  }

  async updatePaymentStatus(
    hotel: string,
    body: any,
  ): Promise<Edo_Cuenta | null> {
    console.log('bodyyyy', body);

    const { _id, estatus, fechaCancelado, autorizo } = body;

    const edoCuenta = body.edoCuenta;
    const isDescuento = edoCuenta?.Forma_de_Pago === 'Descuento';

    // 🔑 Extract pagoId ONLY for payments
    const pagoId =
      !isDescuento &&
      Array.isArray(edoCuenta?.ID_Pago) &&
      edoCuenta.ID_Pago.length > 0
        ? edoCuenta.ID_Pago[0]
        : null;

    console.log('--- updatePaymentStatus START ---');
    console.log({ hotel, _id, estatus, isDescuento, pagoId });

    try {
      /**
       * ============================
       * 1️⃣ Update main document
       * ============================
       */
      const updatedDoc = await this.accountingModel.findOneAndUpdate(
        { _id, hotel },
        {
          $set: {
            Estatus: estatus,
            Fecha_Cancelado: fechaCancelado,
            Autorizo: autorizo,
          },
          ...(pagoId && {
            $pull: { ID_Pago: pagoId },
          }),
        },
        { new: true },
      );

      if (!updatedDoc) {
        console.warn(`❌ Documento no encontrado: ${_id}`);
        return null;
      }

      console.log(
        '✅ Documento principal actualizado:',
        updatedDoc._id.toString(),
      );

      /**
       * ============================
       * 2️⃣ CANCEL PAYMENT → remove ID_Pago from cargos
       * ============================
       */
      if (!isDescuento && pagoId) {
        await this.accountingModel.updateMany(
          {
            hotel,
            ID_Pago: { $type: 'array' },
          },
          {
            $pull: { ID_Pago: pagoId },
          },
        );

        console.log('🧹 ID_Pago removed from cargos');
      }

      /**
       * ============================
       * 3️⃣ CANCEL DESCUENTO → revert cargos
       * ============================
       */
      if (
        isDescuento &&
        estatus === 'Cancelado' &&
        Array.isArray(updatedDoc.RelatedCuentas) &&
        updatedDoc.RelatedCuentas.length > 0
      ) {
        const relatedIds = updatedDoc.RelatedCuentas.map(
          (c: any) => c?._id,
        ).filter(Boolean);

        console.log('↩️ Reverting Descuento_Aplicado on cargos:', relatedIds);

        if (relatedIds.length) {
          const res = await this.accountingModel.updateMany(
            {
              _id: { $in: relatedIds },
              hotel,
            },
            {
              $set: { Descuento_Aplicado: false },
            },
          );

          console.log('🧾 Cargos reverted:', res.modifiedCount);
        }
      }

      /**
       * ============================
       * 4️⃣ Notify listeners
       * ============================
       */
      this.broadcast(updatedDoc);
      console.log('📡 broadcast sent');
      console.log('--- updatePaymentStatus END ---');

      return updatedDoc;
    } catch (err) {
      console.error('🔥 Error updating payment status:', err);
      throw err;
    }
  }

  async updateHospedaje(hotel: string, body: any): Promise<Edo_Cuenta[]> {
    try {
      // Convert Fecha to Date if it's a string
      const updateData = {
        ...body.edoCuenta,
        Fecha: body.edoCuenta.Fecha,
      };

      const updatedEdoCuenta = await this.accountingModel.findOneAndUpdate(
        {
          Folio: body.folio,
          hotel: hotel,
        },
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
        { new: true }, // This option returns the updated document
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

  async getAllAccounts(hotel: string): Promise<Edo_Cuenta[]> {
    try {
      const data = await this.accountingModel.find({ hotel }).exec(); // Use exec() for a promise-based approach
      return data || []; // Return an empty array if no data is found
    } catch (err) {
      console.error('Error fetching accounts:', err);
      throw err; // Rethrow the error for further handling if needed
    }
  }

  async updateBalance(hotel: string, body: any): Promise<Edo_Cuenta[]> {
    return this.accountingModel
      .findOneAndUpdate(
        { Folio: body.folio, hotel: hotel },
        { $set: { Cargo: body.monto } },
      )
      .then((data) => {
        if (!data) {
          return;
        }
        if (data) {
          this.broadcast(data);
          return data;
        }
      })
      .catch((err) => {
        return err;
      });
  }

  async actualizaTotales(hotel: string, body: any): Promise<any> {
    try {
      // Find data matching the folio and hotel
      const data = await this.accountingModel.find({
        Folio: body.folio,
        hotel: hotel,
      });

      // If no data is found, return an empty array
      if (!data || data.length === 0) {
        console.warn('No matching accounting data found');
        return [];
      }

      // Calculate the total using reduce
      const saldoPendiente = this.calculatePendiente(data);

      // Update the model with the calculated total
      const updatedDocument = await this.guestModel.findOneAndUpdate(
        { folio: body.folio, hotel: hotel },
        { $set: { pendiente: saldoPendiente, porPagar: saldoPendiente } },
        { new: true }, // Return the updated document
      );

      // If update is successful, return the updated reserva document directly
      if (updatedDocument) {
        this.broadcast(updatedDocument);
        return [updatedDocument]; // Wrap the updated document in an array
      } else {
        console.warn('No matching reserva document found for update');
        return [];
      }
    } catch (err) {
      console.error('Error:', err);
      return []; // Return empty array in case of error
    }
  }

  calculatePendiente(data: Edo_Cuenta[]): number {
    if (!data || data.length === 0) {
      return 0; // Return 0 if the data is undefined or empty
    }
    return data.reduce((acc, item) => {
      if (item?.Estatus === 'Cancelado') {
        return acc; // Skip this item
      }
      const cargo = item?.Cargo ?? 0; // Default to 0 if Cargo is undefined
      const abono = item?.Abono ?? 0; // Default to 0 if Abono is undefined
      return acc + cargo - abono; // Accumulate the result
    }, 0); // Initial value is 0
  }

  private getPagoId(idPago: any): string | null {
    if (!Array.isArray(idPago)) return null;

    const validIds = idPago.filter(
      (id) => typeof id === 'string' && id.trim().length > 0,
    );

    // Payment MUST have exactly one logical ID
    return validIds.length > 0 ? validIds[validIds.length - 1] : null;
  }
}
