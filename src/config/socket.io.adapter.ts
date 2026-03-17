import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

type CorsOriginFn = (
  origin: string,
  callback: (err: Error | null, allow?: boolean) => void,
) => void;

export class CorsIoAdapter extends IoAdapter {
  constructor(app: any, private readonly corsOrigin: CorsOriginFn) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.corsOrigin, credentials: true },
    });
  }
}
