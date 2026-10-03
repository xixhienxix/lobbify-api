// tenant/secret.utils.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const getKey = () => {
  const hex = process.env.EMAIL_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64)
    throw new Error('EMAIL_ENCRYPTION_KEY must be 32 bytes hex');
  return Buffer.from(hex, 'hex');
};

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString('base64')).join(':');
}

export function decryptSecret(payload: string): string {
  const [iv, tag, enc] = payload
    .split(':')
    .map((p) => Buffer.from(p, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString(
    'utf8',
  );
}
