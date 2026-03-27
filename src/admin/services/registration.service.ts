import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { TenantService } from 'src/tenant/tenant.service';
import { Connection, Types, Schema } from 'mongoose';
import { ParametrosSchema } from 'src/parametros/models/parametros.model';
import {
  GuestSchema,
  HuespedDetailsSchema,
} from 'src/guests/models/guest.model';
import { RoomsSchema } from 'src/rooms/models/rooms.model';
import { TarifasSchema } from 'src/tarifas/_models/tarifas.model';
import { HouseKeepingSchema } from 'src/housekeepingcodes/models/housekeeping.model';
import {
  EstatusSchema,
  FoliadorSchema,
  CodesSchema,
  AdicionalSchema,
} from 'src/codes/_models/codes.model';
import { LogSchema } from 'src/activitylogs/models/log.model';
import { BloqueosSchema } from 'src/bloqueos/_models/bloqueos.model';
import { PromesasSchema } from 'src/promesas/models/promesas.model';
import { EdoCuentaSchema } from 'src/accounting/models/accounting.model';
import { UsuarioSchema } from 'src/auth/models/user.model';
import { PaquetesSchema } from 'src/paquetes/models/paquetes.model';
import { ParametersSchema } from 'src/booking/_models/parameters.model';
import { promoSchema as PromosSchema } from 'src/promos/models/promos.model';
import { MailService } from 'src/mail/mail.service';

export class RegisterHotelDto {
  @IsString() @IsNotEmpty() nombre: string;
  @IsEmail() @IsNotEmpty() email: string;
  @IsString() @IsNotEmpty() password: string;
  @IsString() @IsOptional() telefono?: string;
  @IsString() @IsOptional() pais?: string;
  @IsString() @IsOptional() checkOut?: string;
  @IsString() @IsOptional() codigoZona?: string;
}

@Injectable()
export class RegistrationService {
  constructor(
    private readonly tenantService: TenantService,
    private readonly mailService: MailService,
  ) {}

  async registerHotel(
    dto: RegisterHotelDto,
  ): Promise<{ message: string; hotelId: string }> {
    const hotelId = this.generateHotelId(dto.nombre);

    const exists = await this.tenantService.hotelExists(hotelId);
    if (exists)
      throw new ConflictException('A hotel with this name already exists');

    try {
      await this.tenantService.registerHotel({
        hotelId,
        nombre: dto.nombre,
        email: dto.email,
        password: dto.password,
        telefono: dto.telefono,
        pais: dto.pais,
        checkOut: dto.checkOut || '12:00',
        codigoZona: dto.codigoZona || 'America/Mexico_City',
      });

      await this.seedHotelDatabase(hotelId, dto);

      await this.mailService.sendWelcomeEmail({
        to: dto.email,
        nombre: dto.nombre,
        password: dto.password,
        hotelId,
        loginUrl: 'https://lobify-front.web.app/auth/login',
      });

      return { message: 'Hotel registered successfully', hotelId };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      console.error('Error registering hotel:', error);
      throw new InternalServerErrorException('Failed to register hotel');
    }
  }

  private async seedHotelDatabase(hotelId: string, dto: RegisterHotelDto) {
    const connection: Connection = await this.tenantService.getConnection(
      hotelId,
    );

    const schemas = [
      { name: 'Parametros', schema: ParametrosSchema },
      { name: 'Reservaciones', schema: GuestSchema },
      { name: 'Habitaciones', schema: RoomsSchema },
      { name: 'Tarifas', schema: TarifasSchema },
      { name: 'Ama_De_Llaves', schema: HouseKeepingSchema },
      { name: 'Estatus', schema: EstatusSchema },
      { name: 'Foliador', schema: FoliadorSchema },
      { name: 'Codes', schema: CodesSchema },
      { name: 'Servicios_Adicionales', schema: AdicionalSchema },
      { name: 'Logs', schema: LogSchema },
      { name: 'Bloqueo', schema: BloqueosSchema },
      { name: 'Promesas_Pago', schema: PromesasSchema },
      { name: 'Edo_Cuenta', schema: EdoCuentaSchema },
      { name: 'usuarios', schema: UsuarioSchema },
      { name: 'Packages', schema: PaquetesSchema },
      { name: 'Booking_Parameters', schema: ParametersSchema },
      { name: 'Promos', schema: PromosSchema },
      { name: 'Detalles_Huesped', schema: HuespedDetailsSchema },
    ];

    for (const s of schemas) {
      if (!connection.models[s.name]) {
        connection.model(s.name, s.schema);
      }
    }

    const m = (name: string) => connection.models[name];

    // ─── 1. PARAMETROS ────────────────────────────────────────────────────────
    await m('Parametros').create({
      checkOut: dto.checkOut || '10:30',
      checkIn: '15:00',
      divisa: 'Peso',
      ish: 3,
      iva: 16,
      noShow: '22:00',
      codigoZona: dto.codigoZona || 'America/Mexico_City',
      hotel: hotelId,
      tarifasCancelacion: 'No Reembolsable',
      autoCheckOut: false,
      noShowAutoUpdated: false,
      inventario: 0,
      iddleTimer: 5,
      maxPersonas: 10,
      wifi: '',
      wifiPass: '',
      nombre_cuenta: '',
      cuenta: '',
      clabe: '',
      fecha_limite_pago: 2,
      infoAdicional: '',
      urlMapa: '',
      paginaWeb: '',
      multa: 0,
      depositType: 'percentage',
      depositValue: 30,
    });

    // ─── 2. ADMIN USER ────────────────────────────────────────────────────────
    await m('usuarios').create({
      username: dto.email,
      password: dto.password,
      nombre: dto.nombre,
      email: dto.email,
      terminos: true,
      rol: 1,
      perfil: 1,
      hotel: hotelId,
      accessToken: '',
    });

    // ─── 3. FOLIADOR ──────────────────────────────────────────────────────────
    await m('Foliador').insertMany([
      { _id: new Types.ObjectId(), Folio: '1000', Letra: 'R', hotel: hotelId },
      { _id: new Types.ObjectId(), Folio: '1000', Letra: 'M', hotel: hotelId },
      { _id: new Types.ObjectId(), Folio: '1000', Letra: 'W', hotel: hotelId },
      { _id: new Types.ObjectId(), Folio: '1000', Letra: 'S', hotel: hotelId },
    ]);

    // ─── 4. AMA DE LLAVES ─────────────────────────────────────────────────────
    await m('Ama_De_Llaves').insertMany([
      { Descripcion: 'SUCIA', Color: '#ff1320', hotel: hotelId },
      { Descripcion: 'LIMPIANDO', Color: '#f6b518', hotel: hotelId },
      { Descripcion: 'LIMPIA', Color: '#889f64', hotel: hotelId },
      { Descripcion: 'RETOCAR', Color: '#0388b6', hotel: hotelId },
    ]);

    // ─── 5. ESTATUS ───────────────────────────────────────────────────────────
    await m('Estatus').insertMany([
      { id: 1, color: '#99d284', estatus: 'Huesped en Casa', hotel: hotelId },
      { id: 2, color: '#ffce54', estatus: 'Reserva Sin Pago', hotel: hotelId },
      {
        id: 3,
        color: '#a8d5e5',
        estatus: 'Reserva Confirmada',
        hotel: hotelId,
      },
      { id: 4, color: '#f25b66', estatus: 'Check-Out', hotel: hotelId },
      { id: 5, color: '#d0aaec', estatus: 'Uso Interno', hotel: hotelId },
      {
        id: 6,
        color: '#cacaca',
        estatus: 'Bloqueo / Sin Llegadas',
        hotel: hotelId,
      },
      { id: 7, color: '#a7d5eb', estatus: 'Reserva Temporal', hotel: hotelId },
      {
        id: 8,
        color: '#ffce54',
        estatus: 'Esperando Deposito',
        hotel: hotelId,
      },
      {
        id: 9,
        color: '#a8d5e5',
        estatus: 'Deposito Realizado',
        hotel: hotelId,
      },
      {
        id: 10,
        color: '#a8d5e5',
        estatus: 'Totalmente Pagada',
        hotel: hotelId,
      },
      { id: 11, color: '#f25b66', estatus: 'No Show', hotel: hotelId },
      {
        id: 12,
        color: '#f25b66',
        estatus: 'Reserva Cancelada',
        hotel: hotelId,
      },
    ]);

    // ─── 6. ESTATUS BLOQUEO ───────────────────────────────────────────────────
    const EstatusBloqueoSchema = new Schema(
      { Estatus: Number, Descripcion: String },
      { collection: 'Estatus_Bloqueo' },
    );
    const estatusBloqueoModel =
      connection.models['Estatus_Bloqueo'] ||
      connection.model('Estatus_Bloqueo', EstatusBloqueoSchema);

    await estatusBloqueoModel.insertMany([
      { Estatus: 0, Descripcion: 'No Disponible' },
      { Estatus: 1, Descripcion: 'Disponible' },
      { Estatus: 2, Descripcion: 'No Llegadas' },
      { Estatus: 3, Descripcion: 'No Salidas' },
      { Estatus: 4, Descripcion: 'Fuera de Servicio' },
    ]);

    // ─── 7. ORIGEN ────────────────────────────────────────────────────────────
    const OrigenSchema = new Schema(
      { ID: Number, Descripcion: String, hotel: String },
      { collection: 'Origen' },
    );
    const origenModel =
      connection.models['Origen'] || connection.model('Origen', OrigenSchema);

    await origenModel.insertMany([
      { ID: 1, Descripcion: 'Online', hotel: hotelId },
      { ID: 2, Descripcion: 'BOOKING.COM', hotel: hotelId },
      { ID: 3, Descripcion: 'Directo', hotel: hotelId },
      { ID: 4, Descripcion: 'Teléfono', hotel: hotelId },
      { ID: 5, Descripcion: 'Walk-In', hotel: hotelId },
    ]);

    // ─── 8. CODES ─────────────────────────────────────────────────────────────
    await m('Codes').insertMany([
      // FORMA_PAGO
      {
        Descripcion: 'Efectivo',
        Precio: null,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'Visa',
        Precio: null,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'MASTER CARD',
        Precio: null,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'AMERICAN EXPRESS',
        Precio: null,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'TRANSFERENCIA BANCARIA',
        Precio: null,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'PAYPAL',
        Precio: null,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'MERCADO PAGO',
        Precio: null,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'OPEN PAY',
        Precio: null,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'STRIPE',
        Precio: null,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'Tarjeta de Debito',
        Precio: 0,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'Deposito a Reservacion',
        Precio: null,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'Abono a Estancia',
        Precio: 0,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'Anticipo',
        Precio: 0,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'Cortesía',
        Precio: null,
        Tipo: 'FP',
        Clasificacion: 'FORMA_PAGO',
      },
      // ABONOS
      {
        Descripcion: 'Devolucion',
        Precio: 0,
        Tipo: 'A',
        Clasificacion: 'FORMA_PAGO',
      },
      {
        Descripcion: 'Ajuste',
        Precio: 0,
        Tipo: 'A',
        Clasificacion: 'FORMA_PAGO',
      },
      // SERVICIOS
      {
        Descripcion: 'Noche Extra',
        Precio: 1000,
        Tipo: 'C',
        Clasificacion: 'SERVICES',
      },
      {
        Descripcion: 'Persona Extra',
        Precio: 800,
        Tipo: 'C',
        Clasificacion: 'SERVICES',
      },
      {
        Descripcion: 'Cama Extra',
        Precio: 500,
        Tipo: 'C',
        Clasificacion: 'SERVICES',
      },
      {
        Descripcion: 'Renta Cuna para Bebe',
        Precio: 120,
        Tipo: 'C',
        Clasificacion: 'SERVICES',
      },
      {
        Descripcion: 'Servicio Lavandería',
        Precio: 200,
        Tipo: 'C',
        Clasificacion: 'SERVICES',
      },
      {
        Descripcion: 'Transporte Hotel / Aeropuerto',
        Precio: 550,
        Tipo: 'C',
        Clasificacion: 'SERVICES',
      },
      {
        Descripcion: 'Cama Adicional',
        Precio: 1000,
        Tipo: 'C',
        Clasificacion: 'SERVICES',
      },
      {
        Descripcion: 'Servicio de Catering',
        Precio: 300,
        Tipo: 'C',
        Clasificacion: 'SERVICES',
      },
      {
        Descripcion: 'Banquetes',
        Precio: 600,
        Tipo: 'C',
        Clasificacion: 'SERVICES',
      },
      {
        Descripcion: 'Concepto evento',
        Precio: 600,
        Tipo: 'C',
        Clasificacion: 'SERVICES',
      },
      // POS
      { Descripcion: 'Mini Bar', Precio: 50, Tipo: 'C', Clasificacion: 'POS' },
      {
        Descripcion: 'Desayuno Americano',
        Precio: 100,
        Tipo: 'C',
        Clasificacion: 'POS',
      },
      {
        Descripcion: 'Refresco de Lata',
        Precio: 25,
        Tipo: 'C',
        Clasificacion: 'POS',
      },
      {
        Descripcion: 'Club Sandwich',
        Precio: 120,
        Tipo: 'C',
        Clasificacion: 'POS',
      },
      {
        Descripcion: 'Ensalada Cesar',
        Precio: 90,
        Tipo: 'C',
        Clasificacion: 'POS',
      },
      {
        Descripcion: 'SERVICIO POS',
        Precio: 800,
        Tipo: 'C',
        Clasificacion: 'POS',
      },
      {
        Descripcion: 'Fuente de Sodas',
        Precio: 400,
        Tipo: 'C',
        Clasificacion: 'POS',
      },
      // AMENIDADES
      {
        Descripcion: 'Jacuzzi',
        Precio: 0,
        Tipo: 'AME',
        Clasificacion: 'SERVICES',
      },
      {
        Descripcion: 'Terraza',
        Precio: 0,
        Tipo: 'AME',
        Clasificacion: 'SERVICES',
      },
      {
        Descripcion: 'Bañera',
        Precio: 0,
        Tipo: 'AME',
        Clasificacion: 'SERVICES',
      },
      {
        Descripcion: 'Calefacción',
        Precio: 0,
        Tipo: 'AME',
        Clasificacion: 'SERVICES',
      },
      {
        Descripcion: 'Estacionamiento',
        Precio: 0,
        Tipo: 'AME',
        Clasificacion: 'SERVICES',
      },
      // TIPOS HAB
      {
        Descripcion: 'Habitación',
        Precio: 0,
        Tipo: 'HAB',
        Clasificacion: 'ROOM',
      },
      { Descripcion: 'Cabaña', Precio: 0, Tipo: 'HAB', Clasificacion: 'ROOM' },
      {
        Descripcion: 'Apartamento',
        Precio: 0,
        Tipo: 'HAB',
        Clasificacion: 'ROOM',
      },
      { Descripcion: 'Villa', Precio: 0, Tipo: 'HAB', Clasificacion: 'ROOM' },
      {
        Descripcion: 'Bungalow',
        Precio: 0,
        Tipo: 'HAB',
        Clasificacion: 'ROOM',
      },
      { Descripcion: 'Studio', Precio: 0, Tipo: 'HAB', Clasificacion: 'ROOM' },
      { Descripcion: 'Casa', Precio: 0, Tipo: 'HAB', Clasificacion: 'ROOM' },
      {
        Descripcion: 'Casa de Verano',
        Precio: 0,
        Tipo: 'HAB',
        Clasificacion: 'ROOM',
      },
      {
        Descripcion: 'Dormitorio Compartido',
        Precio: 0,
        Tipo: 'HAB',
        Clasificacion: 'ROOM',
      },
      { Descripcion: 'Camping', Precio: 0, Tipo: 'HAB', Clasificacion: 'ROOM' },
      {
        Descripcion: 'Glam Camping',
        Precio: 0,
        Tipo: 'HAB',
        Clasificacion: 'ROOM',
      },
      { Descripcion: 'Tienda', Precio: 0, Tipo: 'HAB', Clasificacion: 'ROOM' },
      {
        Descripcion: 'Autocarabana',
        Precio: 0,
        Tipo: 'HAB',
        Clasificacion: 'ROOM',
      },
      {
        Descripcion: 'Embarcación',
        Precio: 0,
        Tipo: 'HAB',
        Clasificacion: 'ROOM',
      },
      // CAMAS
      {
        Descripcion: 'Cama Sencilla',
        Precio: 0,
        Tipo: 'CAMA',
        Clasificacion: 'ROOM',
      },
      {
        Descripcion: 'Cama Matrimonial',
        Precio: 0,
        Tipo: 'CAMA',
        Clasificacion: 'ROOM',
      },
      {
        Descripcion: 'Cama Queen Size',
        Precio: 0,
        Tipo: 'CAMA',
        Clasificacion: 'ROOM',
      },
      {
        Descripcion: 'Cama KingSize',
        Precio: 0,
        Tipo: 'CAMA',
        Clasificacion: 'ROOM',
      },
      { Descripcion: 'Cama', Precio: 0, Tipo: 'HAB', Clasificacion: 'ROOM' },
      // ADI
      {
        Descripcion: 'Persona Extra',
        Precio: 400,
        Tipo: 'ADI',
        Clasificacion: 'ROOM',
      },
    ]);

    // ─── 9. SERVICIOS ADICIONALES ─────────────────────────────────────────────
    await m('Servicios_Adicionales').insertMany([
      {
        Descripcion: 'Persona Adicional ($300 por Persona)',
        Adicional: 300,
        hotel: hotelId,
      },
      { Descripcion: 'Control Remoto', Adicional: 0, hotel: hotelId },
      { Descripcion: 'Renta de Bicicletas', Adicional: 0, hotel: hotelId },
    ]);

    // ─── 10. PACKAGES ─────────────────────────────────────────────────────────
    await m('Packages').insertMany([
      {
        Nombre: 'Transporte Hotel / Aeropuerto',
        Habitacion: [],
        Precio: 550,
        Cantidad: 1,
        Descripcion: 'Servicio de transporte hotel-aeropuerto',
        Categoria: ['Servicios', 'Otros'],
      },
      {
        Nombre: 'Persona Extra',
        Habitacion: [],
        Precio: 800,
        Cantidad: 1,
        Descripcion: 'Costo adicional por persona extra en la habitación',
        Categoria: ['Servicios'],
      },
      {
        Nombre: 'Cama Extra',
        Habitacion: [],
        Precio: 500,
        Cantidad: 1,
        Descripcion: 'Cama adicional para habitación',
        Categoria: ['Servicios'],
      },
      {
        Nombre: 'Desayuno Americano',
        Habitacion: [],
        Precio: 100,
        Cantidad: 1,
        Descripcion: 'Desayuno americano completo',
        Categoria: ['Alimentos'],
      },
      {
        Nombre: 'Renta Cuna para Bebe',
        Habitacion: [],
        Precio: 120,
        Cantidad: 1,
        Descripcion: 'Renta de cuna adicional para bebé',
        Categoria: ['Servicios'],
      },
      {
        Nombre: 'Noche Extra',
        Habitacion: [],
        Precio: 1000,
        Cantidad: 1,
        Descripcion: 'Costo por noche adicional de hospedaje',
        Categoria: ['Servicios'],
      },
    ]);

    // ─── 11. BOOKING PARAMETERS ───────────────────────────────────────────────
    await m('Booking_Parameters').create({
      room_auto_assign: true,
      hotel: hotelId,
    });

    console.log(`✅ Database fully seeded for hotel: ${hotelId}`);
  }

  private generateHotelId(nombre: string): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
  }
}
