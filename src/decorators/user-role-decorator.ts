// src/decorators/user-role.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { jwtDecode } from 'jwt-decode';

type TokenPayload = {
  exp: number;
  iat: number;
  usuariosResultQuery: {
    _id: string;
    email: string;
    hotel: string;
    nombre: string;
    password: string;
    rol: string;
    terminos: boolean;
    username: string;
  };
};

/**
 * Decorator to extract user role from JWT token
 *
 * @example
 * @Get('/users')
 * getUsers(@UserRole() role: string) {
 *   console.log(role); // 'ADMIN' or 'USER'
 * }
 */
export const UserRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const authToken = request.headers['authorization'];

    if (!authToken) {
      return 'GUEST';
    }

    try {
      const decoded = jwtDecode(authToken) as TokenPayload;
      return decoded?.usuariosResultQuery?.rol || 'GUEST';
    } catch (error) {
      return 'GUEST';
    }
  },
);
