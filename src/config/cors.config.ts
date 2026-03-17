export const ALLOWED_ORIGINS: (string | RegExp)[] = [
  'http://localhost:4200',
  'http://localhost:4201',
  /^https:\/\/.*\.web\.app$/,
  /^https:\/\/.*\.firebaseapp\.com$/,
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/,
  'https://lobify-front.web.app',
];

import { Logger } from '@nestjs/common';

export function corsOriginHandler(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  if (!origin) return callback(null, true);
  const isAllowed = ALLOWED_ORIGINS.some((a) =>
    typeof a === 'string' ? a === origin : a.test(origin),
  );
  if (isAllowed) {
    callback(null, true);
  } else {
    Logger.warn(`🚫 CORS blocked: ${origin}`, 'CORS');
    callback(new Error(`CORS not allowed for origin: ${origin}`));
  }
}
