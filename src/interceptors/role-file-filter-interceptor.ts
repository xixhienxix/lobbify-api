// src/interceptors/role-field-filter.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { ADMIN_ONLY_FIELDS_KEY } from 'src/decorators/admin-only-decorator';

type TokenPayload = {
  usuariosResultQuery: {
    rol: string;
  };
};

@Injectable()
export class RoleFieldFilterInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const authToken = request.headers['authorization'];

    // Get admin-only fields from decorator metadata
    const adminOnlyFields = this.reflector.get<string[]>(
      ADMIN_ONLY_FIELDS_KEY,
      context.getHandler(),
    );

    // If no fields specified, skip filtering
    if (!adminOnlyFields || adminOnlyFields.length === 0) {
      return next.handle();
    }

    let isAdmin = false;

    if (authToken) {
      try {
        const decoded = jwtDecode(authToken) as TokenPayload;
        isAdmin = decoded?.usuariosResultQuery?.rol === 'ADMIN';
      } catch (error) {
        isAdmin = false;
      }
    }

    return next.handle().pipe(
      map((data) => {
        // If admin, return everything
        if (isAdmin) {
          return data;
        }

        // If not admin, filter out sensitive fields
        return this.filterSensitiveFields(data, adminOnlyFields);
      }),
    );
  }

  private filterSensitiveFields(data: any, fieldsToRemove: string[]): any {
    if (!data) return data;

    // Handle array of objects
    if (Array.isArray(data)) {
      return data.map((item) => this.removeFields(item, fieldsToRemove));
    }

    // Handle single object
    return this.removeFields(data, fieldsToRemove);
  }

  private removeFields(obj: any, fields: string[]): any {
    if (!obj || typeof obj !== 'object') return obj;

    // Clone to avoid mutating the original data
    const filtered = { ...obj };

    // Remove specified fields
    fields.forEach((field) => {
      // Check if the field exists before trying to delete
      if (field in filtered) {
        delete filtered[field];
      }
    });

    return filtered;
  }
}
