import { Injectable, OnModuleInit } from '@nestjs/common';
import { createConnection, Connection, Model } from 'mongoose';
import { environment } from '../environments/environment';
import { Hotel, HotelSchema } from '../admin/models/hotel.model';
import { generateHotelPrefix } from './hotel-prefix.utils';

@Injectable()
export class TenantService implements OnModuleInit {
  private connections = new Map<string, Connection>();
  private adminConnection: Connection;

  async onModuleInit() {
    this.adminConnection = await createConnection(
      `${environment.MONGODB_CONNECTION_URL}/lobbify_admin`,
    ).asPromise();

    console.log('✅ Admin DB connected');
    await this.preloadHotelConnections();
  }

  private async preloadHotelConnections() {
    const hotelModel = (this.adminConnection.models['hotels'] ||
      this.adminConnection.model('hotels', HotelSchema)) as Model<Hotel>;

    const hotels = await hotelModel.find({ status: 'active' }).lean().exec();
    console.log(`📦 Preloading ${hotels.length} hotel connections...`);

    for (const hotel of hotels) {
      await this.getConnection(hotel.hotelId);
    }
  }

  async getConnection(hotelId: string): Promise<Connection> {
    console.log('\n========== TENANT CONNECTION DEBUG ==========');
    console.log('hotelId raw:', hotelId);
    console.log('hotelId JSON:', JSON.stringify(hotelId));
    console.log('hotelId length:', hotelId?.length);
    console.log(
      'hotelId char codes:',
      [...hotelId].map((c) => `${c}=${c.charCodeAt(0)}`),
    );

    if (this.connections.has(hotelId)) {
      console.log('♻️ Using cached connection for:', hotelId);

      const cached = this.connections.get(hotelId);

      console.log('Cached DB name:', cached?.db?.databaseName);
      console.log('=============================================\n');

      return cached;
    }

    const dbUrl = `${environment.MONGODB_CONNECTION_URL}/${hotelId}?retryWrites=true&w=majority`;

    console.log('Creating connection for hotelId:', hotelId);

    // Don't print full dbUrl because it may contain credentials.

    const connection = await createConnection(dbUrl).asPromise();

    console.log('Mongo connected.');
    console.log('Mongo databaseName:', connection.db?.databaseName);
    console.log(
      'Mongo databaseName JSON:',
      JSON.stringify(connection.db?.databaseName),
    );

    connection.on('error', (err) =>
      console.error(`❌ DB error for hotel ${hotelId}:`, err),
    );

    this.connections.set(hotelId, connection);

    console.log(`✅ New DB connection for hotel: ${hotelId}`);
    console.log('=============================================\n');

    return connection;
  }

  getAllHotelIds(): string[] {
    return Array.from(this.connections.keys());
  }

  async hotelExists(hotelId: string): Promise<boolean> {
    const hotelModel = (this.adminConnection.models['hotels'] ||
      this.adminConnection.model('hotels', HotelSchema)) as Model<Hotel>;

    const hotel = await hotelModel.findOne({ hotelId }).lean().exec();
    return !!hotel;
  }

  async registerHotel(hotelData: {
    hotelId: string;
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
    pais?: string;
    checkOut?: string;
    codigoZona?: string;
  }): Promise<void> {
    const hotelModel = (this.adminConnection.models['hotels'] ||
      this.adminConnection.model('hotels', HotelSchema)) as Model<Hotel>;

    const prefix = await generateHotelPrefix(hotelData.nombre, hotelModel);
    await hotelModel.create({ ...hotelData, prefix });

    await this.getConnection(hotelData.hotelId);

    console.log(`✅ Hotel registered: ${hotelData.hotelId}`);
  }

  getAdminConnection(): Connection {
    return this.adminConnection;
  }
}
