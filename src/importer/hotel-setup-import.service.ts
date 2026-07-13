// hotel-setup-import.service.ts
//
// IMPORTANTE — arquitectura multi-tenant real de este proyecto:
// Cada hotel vive en su PROPIA base de Mongo (TenantService.getConnection(hotelId)
// crea la conexión/DB si no existe — Mongo la crea de forma perezosa en el primer
// insert). El directorio maestro de hoteles vive en la DB `lobbify_admin`
// (colección `hotels`), gestionado por TenantService.
//
// Este service YA NO usa @InjectModel/@InjectConnection de @nestjs/mongoose
// (esos apuntan a la conexión default de Nest, que aquí no se usa para datos
// de negocio). En vez de eso, sigue el mismo patrón que RoomImagesService:
// resuelve la conexión del tenant y registra los modelos ahí mismo.
//
// Flujo:
//   1. Mapear el JSON -> shape de cada colección (igual que antes).
//   2. Si el hotel NO existe en `lobbify_admin.hotels` -> TenantService.registerHotel()
//      (esto crea el doc admin Y abre/crea la base nueva del hotel).
//      Si YA existe y upsert=true -> actualizar el doc admin a mano.
//   3. Con la conexión del tenant ya abierta, registrar/obtener cada modelo
//      (Habitaciones, usuarios, Parametros, Tarifas, Estatus, Ama_De_Llaves,
//      Foliador, codes, Servicios_Adicionales) y hacer los inserts ahí.
//   4. Todo dentro de una transacción de esa conexión de tenant (si tu Mongo
//      corre como replica set; si no, ver nota al final).

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Connection, Model, Schema } from 'mongoose';

import { TenantService } from '../tenant/tenant.service'; // ajustar ruta real

// --- Schemas: se registran dinámicamente sobre la conexión del tenant,
// igual que hace RoomImagesService con `connection.model('Habitaciones', RoomsSchema)` ---
import { RoomsSchema } from '../rooms/models/rooms.model'; // ajustar ruta real
import { UsuarioSchema } from '../auth/models/user.model'; // ajustar ruta real
import { ParametrosSchema } from '../parametros/models/parametros.model'; // ajustar ruta real
import { TarifasSchema } from '../tarifas/_models/tarifas.model'; // ajustar ruta real
import {
  EstatusSchema,
  FoliadorSchema,
  CodesSchema,
  AdicionalSchema,
} from '../codes/_models/codes.model'; // ajustar ruta real
import { HouseKeepingSchema } from '../housekeepingcodes/models/housekeeping.model'; // ajustar ruta real
import { HotelSchema } from '../admin/models/hotel.model'; // ajustar ruta real

import { ImportHotelSetupDto } from './models/import-hotel-setup.dto';
import {
  mapHotel,
  mapUsuarioAdmin,
  mapParametros,
  mapHabitaciones,
  mapTarifas,
  mapEstatusDefaults,
  mapAmaDeLlavesDefaults,
  mapFoliadorDefault,
  mapCodesDefaults,
  mapServiciosAdicionalesDefaults,
} from './mappers/hotel-setup.mapper';

// Helper: evita el error de TS "This expression is not callable" que sale al
// hacer `connection.models[name] || connection.model(name, schema)` a pelo —
// esa unión de tipos rompe la resolución de sobrecargas de métodos como
// findOneAndUpdate. Forzamos ambas ramas al mismo tipo explícito con <any>
// (o pásale tu tipo de documento real como generic si lo tienes tipado).
function getOrCreateModel<T = any>(
  connection: Connection,
  name: string,
  schema: Schema,
): Model<T> {
  return (
    (connection.models[name] as Model<T>) ?? connection.model<T>(name, schema)
  );
}

export interface ImportSummary {
  hotelId: string;
  createdOrUpdated: {
    hotel: 'created' | 'updated';
    usuario: boolean;
    parametros: boolean;
    habitaciones: number;
    tarifas: number;
    estatus: number;
    houseKeeping: number;
    foliador: boolean;
    codes: number;
    serviciosAdicionales: number;
  };
}

@Injectable()
export class HotelSetupImportService {
  constructor(private readonly tenantService: TenantService) {}

  async importSetup(dto: ImportHotelSetupDto): Promise<ImportSummary> {
    const { setupJson } = dto;
    const upsert = dto.upsert ?? true;

    // 1. Mapear el hotel primero: de aquí sale el hotelId definitivo.
    const mappedHotel = await mapHotel(setupJson, {
      hotelSlugOverride: dto.hotelSlugOverride,
      adminPassword: dto.adminPassword,
    });
    const hotelId = mappedHotel.hotelId;

    // 2. Crear o actualizar el registro maestro + abrir/crear la base del tenant.
    const alreadyExists = await this.tenantService.hotelExists(hotelId);

    if (alreadyExists && !upsert) {
      throw new BadRequestException(
        `Ya existe un hotel con hotelId "${hotelId}". Manda upsert:true para actualizarlo.`,
      );
    }

    let tenantConnection: Connection;

    if (!alreadyExists) {
      // registerHotel() crea el doc en lobbify_admin.hotels Y abre la conexión
      // nueva (que crea la base física en el primer insert que hagamos).
      await this.tenantService.registerHotel({
        hotelId: mappedHotel.hotelId,
        nombre: mappedHotel.nombre,
        email: mappedHotel.email,
        password: mappedHotel.password, // ya viene hasheado desde el mapper
        telefono: mappedHotel.telefono,
        pais: mappedHotel.pais,
        checkOut: mappedHotel.checkOut,
        codigoZona: mappedHotel.codigoZona,
      });
      tenantConnection = await this.tenantService.getConnection(hotelId);
    } else {
      // Hotel ya existe: actualizamos el doc admin a mano (registerHotel no
      // soporta upsert) y reusamos/abrimos su conexión existente.
      const adminConnection = this.tenantService.getAdminConnection();
      const hotelModel = getOrCreateModel(
        adminConnection,
        'hotels',
        HotelSchema,
      );

      await hotelModel.findOneAndUpdate(
        { hotelId },
        {
          nombre: mappedHotel.nombre,
          email: mappedHotel.email,
          telefono: mappedHotel.telefono,
          pais: mappedHotel.pais,
          checkOut: mappedHotel.checkOut,
          codigoZona: mappedHotel.codigoZona,
          // OJO: no pisamos el password en updates para no invalidar el login
          // del hotel si ya cambió su password manualmente. Si quieres forzarlo
          // en cada reimport, descomenta la siguiente línea:
          // password: mappedHotel.password,
        },
        { new: true },
      );

      tenantConnection = await this.tenantService.getConnection(hotelId);
    }

    // 3. Registrar los modelos sobre la conexión del tenant (igual patrón que
    // RoomImagesService: connection.models[x] || connection.model(x, Schema)).
    const habitacionModel = getOrCreateModel(
      tenantConnection,
      'Habitaciones',
      RoomsSchema,
    );
    const usuarioModel = getOrCreateModel(
      tenantConnection,
      'usuarios',
      UsuarioSchema,
    );
    const parametrosModel = getOrCreateModel(
      tenantConnection,
      'Parametros',
      ParametrosSchema,
    );
    const tarifasModel = getOrCreateModel(
      tenantConnection,
      'Tarifas',
      TarifasSchema,
    );
    const estatusModel = getOrCreateModel(
      tenantConnection,
      'Estatus',
      EstatusSchema,
    );
    const foliadorModel = getOrCreateModel(
      tenantConnection,
      'Foliador',
      FoliadorSchema,
    );
    const codeModel = getOrCreateModel(tenantConnection, 'codes', CodesSchema);
    const adicionalModel = getOrCreateModel(
      tenantConnection,
      'Servicios_Adicionales',
      AdicionalSchema,
    );
    const houseKeepingModel = getOrCreateModel(
      tenantConnection,
      'Ama_De_Llaves',
      HouseKeepingSchema,
    );

    // 4. Mapear el resto de las colecciones.
    const mappedUsuario = await mapUsuarioAdmin(setupJson, hotelId, {
      adminPassword: dto.adminPassword,
    });
    const mappedParametros = mapParametros(setupJson, hotelId);
    const mappedHabitaciones = mapHabitaciones(setupJson, hotelId);
    const mappedTarifas = mapTarifas(setupJson, hotelId);
    const mappedEstatus = mapEstatusDefaults(hotelId);
    const mappedHouseKeeping = mapAmaDeLlavesDefaults();
    const mappedFoliador = mapFoliadorDefault(hotelId);
    const mappedCodes = mapCodesDefaults(hotelId);
    const mappedServiciosAdicionales = mapServiciosAdicionalesDefaults(hotelId);

    // 5. Escribir todo dentro de una transacción DE LA CONEXIÓN DEL TENANT.
    // Requiere que tu Mongo corra como replica set (ver nota al final si no).
    const session = await tenantConnection.startSession();
    try {
      session.startTransaction();

      await usuarioModel.findOneAndUpdate(
        { email: mappedUsuario.email },
        mappedUsuario,
        { upsert: true, new: true, session },
      );

      await parametrosModel.findOneAndUpdate(
        { hotel: hotelId },
        mappedParametros,
        {
          upsert: true,
          new: true,
          session,
        },
      );

      // Reemplazo total en cada reimport para no duplicar (mismo criterio en
      // todas las colecciones de catálogo/inventario).
      await habitacionModel.deleteMany({}, { session });
      await habitacionModel.insertMany(mappedHabitaciones, { session });

      await tarifasModel.deleteMany({}, { session });
      await tarifasModel.insertMany(mappedTarifas, { session });

      await estatusModel.deleteMany({}, { session });
      await estatusModel.insertMany(mappedEstatus, { session });

      await codeModel.deleteMany({}, { session });
      await codeModel.insertMany(mappedCodes, { session });

      await adicionalModel.deleteMany({}, { session });
      await adicionalModel.insertMany(mappedServiciosAdicionales, { session });

      const hkCount = await houseKeepingModel.countDocuments().session(session);
      if (hkCount === 0) {
        await houseKeepingModel.insertMany(mappedHouseKeeping, { session });
      }

      await foliadorModel.findOneAndUpdate({ hotel: hotelId }, mappedFoliador, {
        upsert: true,
        new: true,
        session,
      });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `Falló el import del setup del hotel "${hotelId}": ${
          (err as Error).message
        }`,
      );
    } finally {
      session.endSession();
    }

    return {
      hotelId,
      createdOrUpdated: {
        hotel: alreadyExists ? 'updated' : 'created',
        usuario: true,
        parametros: true,
        habitaciones: mappedHabitaciones.length,
        tarifas: mappedTarifas.length,
        estatus: mappedEstatus.length,
        houseKeeping: mappedHouseKeeping.length,
        foliador: true,
        codes: mappedCodes.length,
        serviciosAdicionales: mappedServiciosAdicionales.length,
      },
    };
  }
}

/**
 * NOTA — transacciones y bases nuevas:
 * Cuando `registerHotel()` abre la conexión de un hotel recién creado, la base
 * física de Mongo todavía no existe (Mongo la crea al primer write). Eso no es
 * problema para `startSession()`/transacciones SIEMPRE que tu servidor Mongo
 * sea un replica set (así sea de un solo nodo) — las transacciones no dependen
 * de que la base ya exista, sino de que el deployment soporte replica set.
 *
 * Si tu Mongo NO corre como replica set: quita `session` de todas las llamadas
 * y acepta que un fallo a medio proceso puede dejar la base del hotel a medias
 * (recomendado en ese caso: si algo falla, hacer `dropDatabase()` de esa
 * conexión de tenant para poder reintentar limpio).
 */
