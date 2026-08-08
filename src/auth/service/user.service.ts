import {
  ConflictException,
  Injectable,
  NotFoundException,
  Scope,
  Inject,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model, Types } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { JWTSECRET } from '../../environments/environment';
import { usuario, UsuarioSchema } from '../models/user.model';
import { TenantService } from 'src/tenant/tenant.service';
import { Hotel, HotelSchema } from 'src/admin/models/hotel.model';

// Fields the catalog endpoints never send back to the frontend
const CAMPOS_PUBLICOS = '-password -passwordHash -accessToken';

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

  // ---------------------------------------------------------------------
  // Existing methods — unchanged
  // ---------------------------------------------------------------------

  async findAll(): Promise<usuario[]> {
    return this.getModel().find().select(CAMPOS_PUBLICOS).exec();
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

  // ---------------------------------------------------------------------
  // New CRUD methods — power the Usuarios catalog
  // ---------------------------------------------------------------------

  async findById(id: string): Promise<usuario> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Id de usuario invalido: ${id}`);
    }

    const encontrado = await this.getModel()
      .findById(id)
      .select(CAMPOS_PUBLICOS)
      .exec();

    if (!encontrado) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return encontrado;
  }

  async create(usuarioData: Partial<usuario>): Promise<usuario> {
    const model = this.getModel();

    if (!usuarioData.username || !usuarioData.email || !usuarioData.password) {
      throw new ConflictException('username, email y password son requeridos');
    }

    const existente = await model
      .findOne({ username: usuarioData.username })
      .exec();

    if (existente) {
      throw new ConflictException(
        `El nombre de usuario "${usuarioData.username}" ya está en uso`,
      );
    }

    const nuevoUsuario = new model({
      nombre: usuarioData.nombre,
      email: usuarioData.email,
      username: usuarioData.username,
      // stored plain text on purpose, to match the existing login()/autoriza()
      // comparisons — see the note below if you want to change this
      password: usuarioData.password,
      terminos: usuarioData.terminos ?? true,
      rol: usuarioData.rol ?? 2,
      perfil: usuarioData.perfil ?? 0,
      hotel: usuarioData.hotel,
    });

    const guardado = await nuevoUsuario.save();

    // Re-fetch through the same .select() used elsewhere, rather than
    // destructuring + casting the saved doc — casting a stripped object to
    // `usuario` fails to typecheck since password/passwordHash/accessToken
    // aren't optional on that class.
    const publico = await model
      .findById(guardado._id)
      .select(CAMPOS_PUBLICOS)
      .exec();

    return publico as usuario;
  }

  async update(id: string, usuarioData: Partial<usuario>): Promise<usuario> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Id de usuario invalido: ${id}`);
    }

    // username is the login key used by login()/autoriza() — never patch it
    // through this endpoint, even if the client sends one
    const { username, ...actualizable } = usuarioData;

    // Empty/omitted password means "leave unchanged" from the frontend form
    if (!actualizable.password) {
      delete actualizable.password;
    }

    const actualizado = await this.getModel()
      .findByIdAndUpdate(id, actualizable, { new: true })
      .select(CAMPOS_PUBLICOS)
      .exec();

    if (!actualizado) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return actualizado;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Id de usuario invalido: ${id}`);
    }

    const eliminado = await this.getModel().findByIdAndDelete(id).exec();

    if (!eliminado) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return { success: true };
  }
}
