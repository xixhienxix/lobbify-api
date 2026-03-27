import { Module } from '@nestjs/common';
import { PaquetesServices } from './services/paquetes.services';
import { PaquetesController } from './controllers/paquetes.controller';

@Module({
  controllers: [PaquetesController],
  providers: [PaquetesServices],
})
export class PackagesModule {}
