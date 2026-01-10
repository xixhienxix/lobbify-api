// src/decorators/admin-only-fields.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ADMIN_ONLY_FIELDS_KEY = 'adminOnlyFields';

export const AdminOnlyFields = (...fields: readonly string[]) =>
  SetMetadata(ADMIN_ONLY_FIELDS_KEY, fields);
