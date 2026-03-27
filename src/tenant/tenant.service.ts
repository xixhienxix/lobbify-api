import { Injectable, OnModuleInit } from '@nestjs/common';
import { createConnection, Connection, Model } from 'mongoose';
import { environment } from '../environments/environment';
import { Hotel, HotelSchema } from '../admin/models/hotel.model';

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
    if (this.connections.has(hotelId)) {
      return this.connections.get(hotelId);
    }

    const dbUrl = `${environment.MONGODB_CONNECTION_URL}/${hotelId}?retryWrites=true&w=majority`;
    const connection = await createConnection(dbUrl).asPromise();

    connection.on('error', (err) =>
      console.error(`❌ DB error for hotel ${hotelId}:`, err),
    );

    this.connections.set(hotelId, connection);
    console.log(`✅ New DB connection for hotel: ${hotelId}`);
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

    await hotelModel.create(hotelData);
    await this.getConnection(hotelData.hotelId);

    console.log(`✅ Hotel registered: ${hotelData.hotelId}`);
  }

  getAdminConnection(): Connection {
    return this.adminConnection;
  }
}
