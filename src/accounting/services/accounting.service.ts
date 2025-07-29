import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Edo_Cuenta } from '../models/accounting.model';
import { huespeds } from 'src/guests/models/guest.model';
import { DateTime } from 'luxon';
@Injectable()
export class AccountingService {
  constructor(
    @InjectModel('Edo_Cuenta')
    private readonly accountingModel: Model<Edo_Cuenta>,
    @InjectModel(huespeds.name) private guestModel: Model<huespeds>,
  ) {}

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

  async addPayment(
    hotel: string,
    body: any,
  ): Promise<{ message: string; data: Edo_Cuenta }> {
    body.edoCuenta.hotel = hotel;

    // const fechaInUserZone = DateTime.fromISO(body.Fecha, { zone: userTimeZone });
    // Convert to UTC Date to store in DB if needed:
    // const fechaUtcDate = fechaInUserZone.toUTC().toJSDate();

    try {
      const newEntry = await this.accountingModel.create(body.edoCuenta);

      // Explicitly wrap the created object in a response structure
      return {
        message: 'Added',
        data: newEntry,
      };
    } catch (err) {
      console.error('Error adding payment:', err);
      throw err;
    }
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

    return insertedDocumentArray;
  }

  async updatePaymentStatus(hotel: string, body: any): Promise<Edo_Cuenta[]> {
    const _id = body._id;

    return this.accountingModel
      .findByIdAndUpdate(
        { _id, hotel: hotel },
        {
          $set: {
            Estatus: body.estatus,
            Fecha_Cancelado: body.fechaCancelado,
            Autorizo: body.autorizo,
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

      return updatedEdoCuenta ? [updatedEdoCuenta] : [];
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
}
