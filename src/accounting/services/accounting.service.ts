import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Edo_Cuenta } from '../models/accounting.model';
@Injectable()
export class AccountingService {
  constructor(
    @InjectModel('Edo_Cuenta')
    private readonly accountingModel: Model<Edo_Cuenta>,
  ) {}

  async getAccounts(hotel: string, folio: string): Promise<Edo_Cuenta[]> {
    return this.accountingModel
      .find({ Folio: folio, hotel: hotel })
      .then((data) => {
        if (!data) {
          return;
        }
        console.log(data);
        if (data) {
          return data;
        }
      })
      .catch((err) => {
        return err;
      });
  }

  async addPayment(hotel: string, body: any): Promise<Edo_Cuenta | null> {
    body.edoCuenta.hotel = hotel;

    try {
      //Check if an entry with the same Folio already exists
      // const existingEntry = await this.accountingModel
      //   .findOne({ id: body.edoCuenta.id })
      //   .exec();

      // if (existingEntry) {
      //   // Return null or handle the case where the entry already exists
      //   console.log('Entry with the same Folio already exists.');
      //   return null;
      // }

      // Create a new entry if it doesn't already exist
      const newEntry = await this.accountingModel.create(body.edoCuenta);
      return newEntry;
    } catch (err) {
      console.error('Error adding payment:', err);
      throw err; // Optionally rethrow the error if you want to handle it further up
    }
  }

  async addHospedaje(hotel: string, body: any): Promise<Edo_Cuenta[]> {
    const insertedDocumentArray = [];
    body.edoCuenta[0].hotel = hotel;

    const result = await this.accountingModel
      .create(body.edoCuenta[0])
      .catch((err) => {
        console.log('Inserting Accounting Error: ', err);
        return err;
      });
    const insertedDocument = await this.accountingModel
      .findOne({
        _id: result.insertedId,
      })
      .catch((err) => {
        console.log('Serched Inserted Item', err);
        return err;
      });
    insertedDocumentArray.push(insertedDocument);
    return insertedDocumentArray;
  }

  async updatePaymentStatus(hotel: string, body: any): Promise<Edo_Cuenta[]> {
    console.log('updatePaymentStatus: ', body);
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
    console.log('updateHospedaje body: ', body);

    try {
      // Convert Fecha to Date if it's a string
      const updateData = {
        ...body.edoCuenta,
        Fecha: new Date(body.edoCuenta.Fecha),
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

      console.log('Updated document:', updatedEdoCuenta);

      return updatedEdoCuenta ? [updatedEdoCuenta] : [];
    } catch (err) {
      console.error('Error updating the payment:', err);
      throw new Error('Error updating the payment');
    }
  }

  async getAllAccounts(hotel: string): Promise<Edo_Cuenta[]> {
    console.log('HOTEL', { hotel });

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
        { _id: body._id, hotel: hotel },
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
}
