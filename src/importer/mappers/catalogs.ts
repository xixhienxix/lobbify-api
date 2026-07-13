// mappers/catalogs.ts
//
// Diccionarios para traducir los "slugs" que manda el formulario de WordPress
// (ej. "vista_alberca", "aire_acondicionado") a etiquetas en español legibles
// para el sistema de hotel (Habitaciones.Amenidades, Habitaciones.Vista, etc).
//
// Si un slug no está en el diccionario, `humanize()` lo convierte de forma
// razonable (guiones bajos -> espacios, capitalizado) en vez de romper el import.
// Recomendado: ir agregando aquí los slugs reales que use el formulario del
// cliente para que las traducciones queden exactas con el tiempo.

export function humanize(slug: string): string {
  if (!slug) return '';
  return slug
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const VIEWS_LABELS: Record<string, string> = {
  vista_alberca: 'Vista a la Alberca',
  vista_jardin: 'Vista al Jardín',
  vista_montana: 'Vista a la Montaña',
  vista_mar: 'Vista al Mar',
  vista_ciudad: 'Vista a la Ciudad',
};

export const BEDS_LABELS: Record<string, string> = {
  king: 'Cama KingSize',
  queen: 'Cama Queen',
  matrimonial: 'Cama Matrimonial',
  individual: 'Cama Individual',
  litera: 'Litera',
  sofa_cama: 'Sofá Cama',
};

// amenities + bathroom + climate + technology + furniture se combinan en
// Habitaciones.Amenidades, todos usando el mismo diccionario.
export const AMENITY_LABELS: Record<string, string> = {
  // amenities
  wifi: 'WiFi',
  agua_cortesia: 'Agua de Cortesía',
  amenidades_bano: 'Amenidades de Baño',
  toallas: 'Toallas',
  ropa_cama: 'Ropa de Cama',
  minibar: 'Minibar',
  cafetera: 'Cafetera',
  caja_fuerte: 'Caja Fuerte',
  plancha: 'Plancha',
  // bathroom
  bano_privado: 'Baño Privado',
  tina: 'Tina',
  jacuzzi: 'Jacuzzi',
  regadera: 'Regadera',
  agua_caliente: 'Agua Caliente',
  secadora: 'Secadora de Pelo',
  espejo: 'Espejo',
  // climate
  aire_acondicionado: 'Aire Acondicionado',
  calefaccion: 'Calefacción',
  chimenea: 'Chimenea',
  mosquiteros: 'Mosquiteros',
  // technology
  smart_tv: 'Smart TV',
  netflix: 'Netflix',
  escritorio_trabajo: 'Escritorio de Trabajo',
  // furniture
  closet: 'Closet',
  terraza_privada: 'Terraza Privada',
  balcon: 'Balcón',
  sillas: 'Sillas',
  sala: 'Sala',
  comedor: 'Comedor',
};

export const ROOM_TYPE_LABELS: Record<string, string> = {
  habitacion: 'Habitación',
  cabana: 'Cabaña',
  suite: 'Suite',
  villa: 'Villa',
  bungalow: 'Bungalow',
  departamento: 'Departamento',
};

export function translateList(
  slugs: string[] | undefined,
  dict: Record<string, string>,
): string[] {
  if (!slugs) return [];
  return slugs.map((s) => dict[s] ?? humanize(s));
}

export function translateOne(
  slug: string | undefined,
  dict: Record<string, string>,
): string {
  if (!slug) return '';
  return dict[slug] ?? humanize(slug);
}

// ---------------------------------------------------------------------------
// Catálogo default de `codes` (colección `codes`) para un hotel nuevo.
//
// Basado en el JSON real de "Hotel Pokemon" que nos compartieron, pero
// DEDUPLICADO y con typos corregidos (traía "Paypal"/"PAYPAL" repetidos,
// "Persona Extra" en dos clasificaciones distintas, "SERVICIOS" vs "SERVICES",
// etc). Todos los precios se siembran en 0 — el hotel los ajusta manualmente
// desde el panel.
// ---------------------------------------------------------------------------

export interface CodeTemplateEntry {
  Descripcion: string;
  Tipo: string;
  Clasificacion: string;
}

export const DEFAULT_CODES_TEMPLATE: CodeTemplateEntry[] = [
  // Formas de pago (ajustes contables)
  { Descripcion: 'Ajuste', Tipo: 'A', Clasificacion: 'FORMA_PAGO' },
  { Descripcion: 'Anticipo', Tipo: 'A', Clasificacion: 'FORMA_PAGO' },
  { Descripcion: 'Abono a Estancia', Tipo: 'A', Clasificacion: 'FORMA_PAGO' },
  { Descripcion: 'Devolucion', Tipo: 'A', Clasificacion: 'FORMA_PAGO' },
  // Formas de pago (métodos)
  { Descripcion: 'Efectivo', Tipo: 'FP', Clasificacion: 'FORMA_PAGO' },
  { Descripcion: 'Tarjeta de Debito', Tipo: 'FP', Clasificacion: 'FORMA_PAGO' },
  { Descripcion: 'Visa', Tipo: 'FP', Clasificacion: 'FORMA_PAGO' },
  { Descripcion: 'MASTER CARD', Tipo: 'FP', Clasificacion: 'FORMA_PAGO' },
  { Descripcion: 'AMERICAN EXPRESS', Tipo: 'FP', Clasificacion: 'FORMA_PAGO' },
  { Descripcion: 'Paypal', Tipo: 'FP', Clasificacion: 'FORMA_PAGO' },
  { Descripcion: 'STRIPE', Tipo: 'FP', Clasificacion: 'FORMA_PAGO' },
  { Descripcion: 'MERCADO PAGO', Tipo: 'FP', Clasificacion: 'FORMA_PAGO' },
  { Descripcion: 'OPEN PAY', Tipo: 'FP', Clasificacion: 'FORMA_PAGO' },
  {
    Descripcion: 'TRANSFERENCIA BANCARIA',
    Tipo: 'FP',
    Clasificacion: 'FORMA_PAGO',
  },
  {
    Descripcion: 'Deposito a Reservacion',
    Tipo: 'FP',
    Clasificacion: 'FORMA_PAGO',
  },
  { Descripcion: 'Cortesía', Tipo: 'FP', Clasificacion: 'FORMA_PAGO' },
  // Tipos de habitación (HAB) — catálogo general de tipos de alojamiento
  { Descripcion: 'Habitación', Tipo: 'HAB', Clasificacion: 'ROOM' },
  { Descripcion: 'Cabaña', Tipo: 'HAB', Clasificacion: 'ROOM' },
  { Descripcion: 'Villa', Tipo: 'HAB', Clasificacion: 'ROOM' },
  { Descripcion: 'Bungalow', Tipo: 'HAB', Clasificacion: 'ROOM' },
  { Descripcion: 'Apartamento', Tipo: 'HAB', Clasificacion: 'ROOM' },
  { Descripcion: 'Studio', Tipo: 'HAB', Clasificacion: 'ROOM' },
  { Descripcion: 'Casa', Tipo: 'HAB', Clasificacion: 'ROOM' },
  { Descripcion: 'Casa de Verano', Tipo: 'HAB', Clasificacion: 'ROOM' },
  { Descripcion: 'Dormitorio Compartido', Tipo: 'HAB', Clasificacion: 'ROOM' },
  { Descripcion: 'Camping', Tipo: 'HAB', Clasificacion: 'ROOM' },
  { Descripcion: 'Glam Camping', Tipo: 'HAB', Clasificacion: 'ROOM' },
  { Descripcion: 'Tienda', Tipo: 'HAB', Clasificacion: 'ROOM' },
  { Descripcion: 'Autocarabana', Tipo: 'HAB', Clasificacion: 'ROOM' },
  { Descripcion: 'Embarcación', Tipo: 'HAB', Clasificacion: 'ROOM' },
  // Tipos de cama (CAMA)
  { Descripcion: 'Cama Sencilla', Tipo: 'CAMA', Clasificacion: 'ROOM' },
  { Descripcion: 'Cama Matrimonial', Tipo: 'CAMA', Clasificacion: 'ROOM' },
  { Descripcion: 'Cama Doble', Tipo: 'CAMA', Clasificacion: 'ROOM' },
  { Descripcion: 'Cama Queen Size', Tipo: 'CAMA', Clasificacion: 'ROOM' },
  { Descripcion: 'Cama KingSize', Tipo: 'CAMA', Clasificacion: 'ROOM' },
  // Cargos extra de habitación (ADI / C-ROOM)
  { Descripcion: 'Persona Extra', Tipo: 'ADI', Clasificacion: 'ROOM' },
  { Descripcion: 'Cama Adicional', Tipo: 'C', Clasificacion: 'ROOM' },
  // Amenidades con costo (AME / SERVICES)
  { Descripcion: 'Estacionamiento', Tipo: 'AME', Clasificacion: 'SERVICES' },
  { Descripcion: 'Jacuzzi', Tipo: 'AME', Clasificacion: 'SERVICES' },
  { Descripcion: 'Bañera', Tipo: 'AME', Clasificacion: 'SERVICES' },
  { Descripcion: 'Calefacción', Tipo: 'AME', Clasificacion: 'SERVICES' },
  { Descripcion: 'Terraza', Tipo: 'AME', Clasificacion: 'SERVICES' },
  // Servicios con cargo (C / SERVICES)
  { Descripcion: 'Noche Extra', Tipo: 'C', Clasificacion: 'SERVICES' },
  { Descripcion: 'Cama Extra', Tipo: 'C', Clasificacion: 'SERVICES' },
  { Descripcion: 'Control Remoto', Tipo: 'C', Clasificacion: 'SERVICES' },
  { Descripcion: 'Servicio Lavandería', Tipo: 'C', Clasificacion: 'SERVICES' },
  { Descripcion: 'Renta Cuna para Bebe', Tipo: 'C', Clasificacion: 'SERVICES' },
  {
    Descripcion: 'Transporte Hotel / Aeropuerto',
    Tipo: 'C',
    Clasificacion: 'SERVICES',
  },
  { Descripcion: 'Servicio de Catering', Tipo: 'C', Clasificacion: 'SERVICES' },
  { Descripcion: 'Banquetes', Tipo: 'C', Clasificacion: 'SERVICES' },
  { Descripcion: 'Concepto Evento', Tipo: 'C', Clasificacion: 'SERVICES' },
  // Punto de venta (POS)
  { Descripcion: 'Mini Bar', Tipo: 'C', Clasificacion: 'POS' },
  { Descripcion: 'Desayuno Americano', Tipo: 'C', Clasificacion: 'POS' },
  { Descripcion: 'Ensalada Cesar', Tipo: 'C', Clasificacion: 'POS' },
  { Descripcion: 'Club Sandwich', Tipo: 'C', Clasificacion: 'POS' },
  { Descripcion: 'Refresco de Lata', Tipo: 'C', Clasificacion: 'POS' },
  { Descripcion: 'Fuente de Sodas', Tipo: 'C', Clasificacion: 'POS' },
  // Otros
  { Descripcion: 'Spray', Tipo: 'C', Clasificacion: 'OTROS' },
];

// ---------------------------------------------------------------------------
// Catálogo default de `Servicios_Adicionales` (colección `Servicios_Adicionales`)
// Basado en el JSON de ejemplo. `Adicional` (el precio) se siembra en 0.
// ---------------------------------------------------------------------------

export const DEFAULT_SERVICIOS_ADICIONALES_TEMPLATE: string[] = [
  'Persona Adicional',
  'Control Remoto',
  'Renta de Bicicletas',
];
