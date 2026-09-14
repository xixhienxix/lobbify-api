import { Model } from 'mongoose';
import { Hotel } from 'src/admin/models/hotel.model';

// tenant/hotel-prefix.util.ts
const SUFFIX_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // no 0/O/1/I/L

function baseInitials(nombre: string): string {
  const words = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .split(/\s+/)
    .filter(
      (w) => w && w !== 'HOTEL' && w !== 'THE' && w !== 'EL' && w !== 'LA',
    );
  if (words.length >= 2) return words[0][0] + words[1][0];
  if (words.length === 1) return words[0].slice(0, 2).padEnd(2, 'X');
  return 'HX';
}

export async function generateHotelPrefix(
  nombre: string,
  hotelModel: Model<Hotel>,
): Promise<string> {
  const base = baseInitials(nombre);
  let candidate = base;
  let attempts = 0;
  while (await hotelModel.exists({ prefix: candidate })) {
    candidate =
      base +
      SUFFIX_ALPHABET[Math.floor(Math.random() * SUFFIX_ALPHABET.length)];
    if (++attempts > 20)
      throw new Error('No se pudo generar un prefijo único.');
  }
  return candidate;
}
