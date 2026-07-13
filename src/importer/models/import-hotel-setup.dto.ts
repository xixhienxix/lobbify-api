// dto/import-hotel-setup.dto.ts
//
// Tipado del JSON completo que envía el equipo de WordPress (Lobify setup export).
// No se valida cada campo anidado con class-validator porque el JSON es grande y
// semi-libre (viene de un formulario externo); solo se valida lo mínimo indispensable
// para poder mapear (hotel_slug, hotel_name, email). El resto se tipa con interfaces
// para tener autocompletado y seguridad en el mapper, pero se trata de forma defensiva
// (todo opcional) porque WordPress puede omitir secciones si el usuario no las llenó.

import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export interface TimezoneSection {
  timezone_country?: string;
  timezone_region_label?: string;
  timezone_offset_label?: string;
  timezone_state?: string;
  timezone_municipality?: string;
  timezone_iana?: string;
}

export interface RegistrationSection {
  hotel_name?: string;
  whatsapp?: string;
  email?: string;
  lodging_type?: string;
  city?: string;
  state?: string;
  comment?: string;
  timezone?: TimezoneSection;
}

export interface HotelAddress {
  full?: string;
  city?: string;
  state?: string;
  country?: string;
  google_maps_url?: string;
}

export interface HotelSection {
  name?: string;
  legal_name?: string;
  lodging_type?: string;
  description?: string;
  special?: string;
  address?: HotelAddress;
}

export interface ContactSection {
  phone_main?: string;
  whatsapp_direct?: string;
  email?: string;
}

export interface SocialSection {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  x_twitter?: string;
  current_website?: string;
}

export interface OperationSection {
  checkin_time?: string;
  checkout_time?: string;
  no_show_time?: string;
  currency?: string;
  iva?: string;
  ish?: string;
  payment_methods?: string[];
  guest_info?: string;
}

export interface BankDetails {
  bank?: string;
  account_holder?: string;
  account_number?: string;
  clabe?: string;
  payment_deadline_days?: string;
  deposit_type?: 'porcentaje' | 'cantidad' | string;
  deposit_value?: string;
  payment_instructions?: string;
}

export interface PaymentSetupSection {
  reservation_deposit?: {
    type?: string;
    value?: string;
    payment_deadline_days_before_arrival?: string;
  };
  bank_details?: BankDetails;
}

export interface BaseRatePolicySection {
  cancel_policy_type?: string;
  cancel_limit_hours?: string;
  cancel_penalty?: string;
  refund_retention_type?: string;
  refund_retention_value?: string;
  cancel_notes?: string;
}

export interface HouseRulesSection {
  pets_policy?: string;
  pets_conditions?: string;
  kids_free_allowed?: string;
  kids_free_age?: string;
  accessibility?: string;
  damage_policy?: string;
  additional_rules?: string;
}

export interface PhysicalUnit {
  name?: string;
}

export interface RoomTypeSection {
  room_slug?: string;
  public_name?: string;
  base_type?: string; // habitacion | cabana | ...
  inventory_qty?: string;
  physical_units?: PhysicalUnit[];
  capacity_max?: string;
  size_m2?: string;
  base_rate?: string;
  extra_person_allowed?: string;
  extra_person_cost?: string;
  simple_description?: string;
  special?: string;
  beds?: string[];
  amenities?: string[];
  views?: string[];
  bathroom?: string[];
  climate?: string[];
  technology?: string[];
  furniture?: string[];
}

export interface HotelSetupJson {
  setup?: Record<string, any>;
  registration?: RegistrationSection;
  timezone?: TimezoneSection;
  hotel?: HotelSection;
  contact?: ContactSection;
  social?: SocialSection;
  operation?: OperationSection;
  payment_setup?: PaymentSetupSection;
  base_rate_policy?: BaseRatePolicySection;
  house_rules?: HouseRulesSection;
  catalogs_selected?: Record<string, string[]>;
  rooms?: RoomTypeSection[];
  home_highlights?: Record<string, any>;
  assets?: Record<string, any>;
  contract?: Record<string, any>;
  events?: any[];
}

/**
 * Body real del endpoint. `setupJson` es el archivo completo que manda WordPress.
 * `options` permite controlar el comportamiento del import sin tocar el JSON fuente.
 */
export class ImportHotelSetupDto {
  @IsObject()
  @IsNotEmpty()
  setupJson: HotelSetupJson;

  @IsOptional()
  @IsString()
  hotelSlugOverride?: string; // por si se quiere forzar un slug distinto al del JSON

  @IsOptional()
  adminPassword?: string; // si no se manda, se usa el default acordado ('12345')

  @IsOptional()
  upsert?: boolean; // default true: si el hotel ya existe, actualiza en vez de fallar
}
