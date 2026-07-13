// mappers/hotel-setup.mapper.ts
//
// Funciones puras: reciben el JSON de setup (o una sección) y devuelven objetos
// con la forma exacta de cada colección Mongo (Hotel, Parametros, usuario,
// room/Habitaciones, tarifas, estatus, Foliador, HouseKeeping).
// No tocan la base de datos: eso lo hace el service (hotel-setup-import.service.ts).

import * as bcrypt from 'bcrypt';
import {
  HotelSetupJson,
  RoomTypeSection,
} from '../models/import-hotel-setup.dto';
import {
  AMENITY_LABELS,
  ROOM_TYPE_LABELS,
  VIEWS_LABELS,
  BEDS_LABELS,
  translateList,
  translateOne,
  DEFAULT_CODES_TEMPLATE,
  DEFAULT_SERVICIOS_ADICIONALES_TEMPLATE,
} from './catalogs';

const DEFAULT_ADMIN_PASSWORD = '12345'; // acordado temporalmente con el cliente

// --- utilidades ---------------------------------------------------------

function slugify(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toNumber(value: string | number | undefined, fallback = 0): number {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

/** "habitacion-sencilla" + "Habitación Sencilla" -> "SENCILLA" */
function deriveCodigo(room: RoomTypeSection): string {
  const base = room.public_name || room.room_slug || '';
  const prefixed = base.replace(/^Habitaci[oó]n\s+/i, '').trim();
  return (prefixed || base).toLocaleUpperCase('es-MX');
}

// --- Hotel ---------------------------------------------------------------

export interface MappedHotel {
  hotelId: string;
  nombre: string;
  email: string;
  password: string; // ya hasheado
  status: string;
  checkOut: string;
  codigoZona: string;
  telefono: string;
  pais: string;
}

export async function mapHotel(
  json: HotelSetupJson,
  opts: { hotelSlugOverride?: string; adminPassword?: string },
): Promise<MappedHotel> {
  const reg = json.registration ?? {};
  const hotel = json.hotel ?? {};
  const contact = json.contact ?? {};
  const operation = json.operation ?? {};
  const tz = json.timezone ?? reg.timezone ?? {};

  const hotelId =
    opts.hotelSlugOverride ??
    (json.setup as any)?.hotel_slug ??
    slugify(hotel.name ?? reg.hotel_name ?? '');

  if (!hotelId) {
    throw new Error(
      'No se pudo determinar hotel_slug/hotelId a partir del JSON (setup.hotel_slug o hotel.name).',
    );
  }

  const rawPassword = opts.adminPassword ?? DEFAULT_ADMIN_PASSWORD;
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  return {
    hotelId,
    nombre: hotel.name ?? reg.hotel_name ?? '',
    email: contact.email ?? reg.email ?? '',
    password: hashedPassword,
    status: 'active',
    checkOut: operation.checkout_time ?? '',
    codigoZona: tz.timezone_iana ?? tz.timezone_offset_label ?? '',
    telefono:
      contact.phone_main ?? contact.whatsapp_direct ?? reg.whatsapp ?? '',
    pais: hotel.address?.country ?? 'México',
  };
}

// --- usuario (admin) -------------------------------------------------------

export interface MappedUsuario {
  username: string;
  password: string;
  passwordHash: string;
  nombre: string;
  email: string;
  terminos: boolean;
  rol: number;
  perfil: number;
  hotel: string;
  accessToken: string;
}

export async function mapUsuarioAdmin(
  json: HotelSetupJson,
  hotelId: string,
  opts: { adminPassword?: string },
): Promise<MappedUsuario> {
  const reg = json.registration ?? {};
  const hotel = json.hotel ?? {};
  const contact = json.contact ?? {};
  const email = contact.email ?? reg.email ?? '';
  const rawPassword = opts.adminPassword ?? DEFAULT_ADMIN_PASSWORD;
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  return {
    username: email,
    password: rawPassword, // se guarda también en claro solo porque el schema actual lo contempla;
    // ideal a futuro: eliminar este campo y quedarse solo con passwordHash.
    passwordHash,
    nombre: hotel.name ?? reg.hotel_name ?? 'Administrador',
    email,
    terminos: true,
    rol: 1, // admin
    perfil: 1,
    hotel: hotelId,
    accessToken: '',
  };
}

// --- Parametros ------------------------------------------------------------

export interface MappedParametros {
  checkOut: string;
  checkIn: string;
  divisa: string;
  ish: number;
  iva: number;
  noShow: string;
  zona: string;
  codigoZona: string;
  hotel: string;
  tarifasCancelacion: string;
  autoCheckOut: boolean;
  noShowAutoUpdated: boolean;
  inventario: number;
  iddleTimer: number;
  maxPersonas: number;
  wifi: string;
  wifiPass: string;
  nombre_cuenta: string;
  cuenta: string;
  clabe: string;
  fecha_limite_pago: number;
  infoAdicional: string;
  urlMapa: string;
  paginaWeb: string;
  multa: number;
  whatsapp: string;
  depositType: 'percentage' | 'quantity';
  depositValue: number;
}

export function mapParametros(
  json: HotelSetupJson,
  hotelId: string,
): MappedParametros {
  const operation = json.operation ?? {};
  const tz = json.timezone ?? json.registration?.timezone ?? {};
  const bank = json.payment_setup?.bank_details ?? {};
  const hotel = json.hotel ?? {};
  const social = json.social ?? {};
  const contact = json.contact ?? {};
  const cancelPolicy = json.base_rate_policy ?? {};

  const depositTypeRaw =
    bank.deposit_type ??
    json.payment_setup?.reservation_deposit?.type ??
    'porcentaje';
  const depositType: 'percentage' | 'quantity' =
    depositTypeRaw === 'cantidad' ? 'quantity' : 'percentage';

  const depositValueRaw =
    bank.deposit_value ?? json.payment_setup?.reservation_deposit?.value ?? '0';

  // Encapsulamos toda la política de cancelación como texto legible; si prefieren
  // JSON crudo para parsear después, cambiar a JSON.stringify(cancelPolicy).
  const tarifasCancelacionTexto = [
    cancelPolicy.cancel_policy_type,
    cancelPolicy.cancel_limit_hours &&
      `Límite: ${cancelPolicy.cancel_limit_hours}h`,
    cancelPolicy.cancel_penalty &&
      `Penalización: ${cancelPolicy.cancel_penalty}`,
    cancelPolicy.refund_retention_value &&
      `Retención: ${cancelPolicy.refund_retention_value}${
        cancelPolicy.refund_retention_type === 'porcentaje' ? '%' : ''
      }`,
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    checkOut: operation.checkout_time ?? '',
    checkIn: operation.checkin_time ?? '',
    divisa: operation.currency ?? 'MXN',
    ish: toNumber(operation.ish),
    iva: toNumber(operation.iva),
    noShow: operation.no_show_time ?? '',
    zona: tz.timezone_iana ?? '',
    codigoZona: tz.timezone_offset_label ?? '',
    hotel: hotelId,
    tarifasCancelacion: tarifasCancelacionTexto,
    autoCheckOut: false,
    noShowAutoUpdated: false,
    inventario: 0,
    iddleTimer: 0,
    maxPersonas: 0,
    wifi: '',
    wifiPass: '',
    nombre_cuenta: bank.account_holder ?? '',
    cuenta: bank.account_number ?? '',
    clabe: bank.clabe ?? '',
    fecha_limite_pago: toNumber(bank.payment_deadline_days),
    infoAdicional: operation.guest_info ?? '',
    urlMapa: hotel.address?.google_maps_url ?? '',
    paginaWeb: social.current_website ?? '',
    multa: 0,
    whatsapp: contact.whatsapp_direct ?? contact.phone_main ?? '',
    depositType,
    depositValue: toNumber(depositValueRaw),
  };
}

// --- Habitaciones (una por unidad física) -----------------------------------

export interface MappedHabitacion {
  Codigo: string;
  Numero: string;
  Descripcion: string;
  Estatus: string;
  Camas: number;
  Personas: number;
  Adultos: number;
  Ninos: number;
  Tarifa: number;
  Tipo: string;
  Vista: string;
  Amenidades: string[];
  Tipos_Camas: string[];
  Inventario: number;
  Orden: number;
  URL: string;
  images: any[];
  hotel: string;
}

export function mapHabitaciones(
  json: HotelSetupJson,
  hotelId: string,
): MappedHabitacion[] {
  const rooms = json.rooms ?? [];
  const result: MappedHabitacion[] = [];

  rooms.forEach((room, index) => {
    const codigo = deriveCodigo(room);
    const tipo = translateOne(room.base_type, ROOM_TYPE_LABELS);
    const vista = translateList(room.views, VIEWS_LABELS).join(' / ');
    const amenidades = [
      ...translateList(room.amenities, AMENITY_LABELS),
      ...translateList(room.bathroom, AMENITY_LABELS),
      ...translateList(room.climate, AMENITY_LABELS),
      ...translateList(room.technology, AMENITY_LABELS),
      ...translateList(room.furniture, AMENITY_LABELS),
    ];
    const tiposCamas = (room.beds ?? []).map(
      (b) => `1 ${translateOne(b, BEDS_LABELS)}`,
    );
    const camas = (room.beds ?? []).length || 1;
    const inventario = toNumber(room.inventory_qty, 1);
    const personas = toNumber(room.capacity_max);

    const unidades = (room.physical_units ?? [])
      .map((u) => u.name?.trim())
      .filter((name): name is string => !!name);

    // Si el formulario no trae unidades físicas nombradas, generamos N
    // placeholders numerados para no perder el inventario declarado.
    const numeros =
      unidades.length > 0
        ? unidades
        : Array.from({ length: inventario }, (_, i) => `${codigo}-${i + 1}`);

    numeros.forEach((numero) => {
      result.push({
        Codigo: codigo,
        Numero: numero,
        Descripcion: room.simple_description ?? '',
        Estatus: 'LIMPIA', // estado inicial por defecto para cuarto recién dado de alta
        Camas: camas,
        Personas: personas,
        Adultos: personas,
        Ninos: 0,
        Tarifa: toNumber(room.base_rate),
        Tipo: tipo,
        Vista: vista,
        Amenidades: amenidades,
        Tipos_Camas: tiposCamas,
        Inventario: inventario,
        Orden: index + 1,
        URL: '',
        images: [], // fotos ignoradas por ahora (acordado)
        hotel: hotelId,
      });
    });
  });

  return result;
}

// --- Tarifas (una tarifa rack base por tipo de cuarto) ----------------------

export interface MappedTarifa {
  Tarifa: string;
  Habitacion: string[];
  Plan: string;
  Politicas: any;
  EstanciaMinima: number;
  EstanciaMaxima: number;
  TarifaRack: number;
  Estado: boolean;
  Cancelacion: any;
  Adultos: number;
  Ninos: number;
  Descuento: number;
  hotel: string;
}

export function mapTarifas(
  json: HotelSetupJson,
  hotelId: string,
): MappedTarifa[] {
  const rooms = json.rooms ?? [];
  const cancelPolicy = json.base_rate_policy ?? {};

  return rooms.map((room) => ({
    Tarifa: `Tarifa Rack - ${room.public_name ?? deriveCodigo(room)}`,
    Habitacion: [deriveCodigo(room)],
    Plan: 'Solo Hospedaje',
    Politicas: {},
    EstanciaMinima: 1,
    EstanciaMaxima: 0,
    TarifaRack: toNumber(room.base_rate),
    Estado: true,
    Cancelacion: {
      tipo: cancelPolicy.cancel_policy_type ?? '',
      limiteHoras: toNumber(cancelPolicy.cancel_limit_hours),
      penalizacion: cancelPolicy.cancel_penalty ?? '',
      retencionTipo: cancelPolicy.refund_retention_type ?? '',
      retencionValor: toNumber(cancelPolicy.refund_retention_value),
      notas: cancelPolicy.cancel_notes ?? '',
    },
    Adultos: toNumber(room.capacity_max),
    Ninos: 0,
    Descuento: 0,
    hotel: hotelId,
  }));
}

// --- Estatus (catálogo default de estados de cuarto) ------------------------

export interface MappedEstatus {
  id: number;
  color: string;
  hotel: string;
  estatus: string;
}

const DEFAULT_ROOM_STATUSES: { estatus: string; color: string }[] = [
  { estatus: 'LIMPIA', color: '#4CAF50' },
  { estatus: 'SUCIA', color: '#F44336' },
  { estatus: 'LIMPIANDO', color: '#2196F3' },
  { estatus: 'RETOCAR', color: '#FFC107' },
];

export function mapEstatusDefaults(hotelId: string): MappedEstatus[] {
  return DEFAULT_ROOM_STATUSES.map((s, i) => ({
    id: i + 1,
    color: s.color,
    hotel: hotelId,
    estatus: s.estatus,
  }));
}

// --- Ama_De_Llaves (mismo catálogo de estados, para housekeeping) ----------

export interface MappedHouseKeeping {
  Descripcion: string;
  Color: string;
}

export function mapAmaDeLlavesDefaults(): MappedHouseKeeping[] {
  return DEFAULT_ROOM_STATUSES.map((s) => ({
    Descripcion: s.estatus,
    Color: s.color,
  }));
}

// --- Foliador (contador de folios inicial) ----------------------------------

export interface MappedFoliador {
  Folio: string;
  Letra: string;
  hotel: string;
}

export function mapFoliadorDefault(hotelId: string): MappedFoliador {
  return {
    Folio: '0',
    Letra: 'A',
    hotel: hotelId,
  };
}

// --- codes (catálogo de conceptos/formas de pago/amenidades del hotel) -----
//
// NOTA: `divisas` y `timezones` son catálogos GLOBALES (compartidos por todos
// los hoteles, no tienen `hotel` en su schema real) y por eso NO se siembran
// aquí — deben existir ya en la base una sola vez. Si tu base está vacía,
// se importan una sola vez por separado (seed global), no por hotel.

export interface MappedCode {
  Descripcion: string;
  Precio: number;
  Tipo: string;
  hotel: string;
  Clasificacion: string;
}

export function mapCodesDefaults(hotelId: string): MappedCode[] {
  return DEFAULT_CODES_TEMPLATE.map((c) => ({
    Descripcion: c.Descripcion,
    Precio: 0, // el hotel lo ajusta manualmente desde el panel
    Tipo: c.Tipo,
    hotel: hotelId,
    Clasificacion: c.Clasificacion,
  }));
}

// --- Servicios_Adicionales (colección `Adicional`) --------------------------

export interface MappedServicioAdicional {
  Descripcion: string;
  Adicional: number;
  hotel: string;
}

export function mapServiciosAdicionalesDefaults(
  hotelId: string,
): MappedServicioAdicional[] {
  return DEFAULT_SERVICIOS_ADICIONALES_TEMPLATE.map((desc) => ({
    Descripcion: desc,
    Adicional: 0, // el hotel lo ajusta manualmente desde el panel
    hotel: hotelId,
  }));
}
