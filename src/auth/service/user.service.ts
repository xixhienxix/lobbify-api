import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { JWTSECRET } from '../../environments/environment';
import { usuario, UsuarioSchema } from '../models/user.model';
import { TenantService } from 'src/tenant/tenant.service';
import { Hotel, HotelSchema } from 'src/admin/models/hotel.model';
@Injectable({ scope: Scope.REQUEST })
export class UserService {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly tenantService: TenantService,
  ) {}

  private getModel(): Model<usuario> {
    const connection: Connection = (this.request as any).dbConnection;
    return (
      connection.models['usuarios'] ||
      connection.model('usuarios', UsuarioSchema)
    );
  }

  async findAll(): Promise<usuario[]> {
    return this.getModel().find().exec();
  }

  async findOne(username: string): Promise<usuario> {
    return this.getModel().findOne({ username }).exec();
  }

  async findHotels(): Promise<string[]> {
    return this.getModel()
      .distinct('hotel')
      .lean()
      .then((db_res) => db_res || [])
      .catch((err) => {
        console.log(err);
        throw err;
      });
  }

  async autoriza(body: any): Promise<any> {
    const model = this.getModel();
    return model
      .findOne({ username: body.username })
      .then((data) => {
        if (!data) return { id: 1, message: 'Nombre de usuario invalido' };
        return model
          .findOne({ username: body.username, password: body.password })
          .then((data) => {
            if (!data)
              return {
                id: 2,
                message:
                  'Password incorrecto para el usuario: ' + body.username,
              };
            return data.perfil === 1
              ? { id: 3, message: 'Usuario Autorizado' }
              : { id: 4, message: 'Usuario No Autorizado' };
          })
          .catch((err) => err);
      })
      .catch((err) => err);
  }

  async login(username: string, plainTextPassword: string): Promise<any> {
    const user = await this.getModel()
      .findOne({ username, password: plainTextPassword })
      .lean()
      .catch((err) => {
        console.log(err);
        return null;
      });

    if (!user) return { mensaje: 'usuario inexistente' };

    const authJwtToken = jwt.sign(
      { usuariosResultQuery: user }, // 👈 same fix
      JWTSECRET,
      { expiresIn: '30m' },
    );
    user.accessToken = authJwtToken;
    return user;
  }

  async loginFromAdmin(
    username: string,
    plainTextPassword: string,
  ): Promise<any> {
    console.log('🔐 loginFromAdmin called');
    console.log('   username:', username);
    console.log('   password:', plainTextPassword);

    const adminConnection: Connection = this.tenantService.getAdminConnection();
    const HotelModel = (adminConnection.models['hotels'] ||
      adminConnection.model('hotels', HotelSchema)) as Model<Hotel>;

    const hotels = await HotelModel.find({ status: 'active' }).lean();
    console.log(
      `🏨 Found ${hotels.length} active hotels:`,
      hotels.map((h) => h.hotelId),
    );

    for (const hotel of hotels) {
      console.log(`\n🔍 Searching in hotel: ${hotel.hotelId}`);

      const tenantConnection = await this.tenantService.getConnection(
        hotel.hotelId,
      );
      const userModel = (tenantConnection.models['usuarios'] ||
        tenantConnection.model('usuarios', UsuarioSchema)) as Model<usuario>;

      // Check all users in this hotel's DB
      const allUsers = await userModel.find().lean();
      console.log(
        `   Users in ${hotel.hotelId}:`,
        allUsers.map((u) => ({
          username: u.username,
          password: u.password,
          hotel: u.hotel,
        })),
      );

      const user = await userModel
        .findOne({ username, password: plainTextPassword })
        .lean();

      console.log(`   Match found:`, !!user);

      if (user) {
        // 👇 match the exact structure the guard expects
        const authJwtToken = jwt.sign(
          { usuariosResultQuery: user },
          JWTSECRET,
          { expiresIn: '30m' },
        );
        user.accessToken = authJwtToken;
        return user;
      }
    }

    console.log('❌ No user found across all hotels');
    return { mensaje: 'usuario inexistente' };
  }
}
