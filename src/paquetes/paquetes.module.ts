import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Paquetes, PaquetesSchema } from './models/paquetes.model';
import { PaquetesServices } from './services/paquetes.services';
import { PaquetesController } from './controllers/paquetes.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Paquetes.name, schema: PaquetesSchema },
    ]),
  ],
  controllers: [PaquetesController],
  providers: [PaquetesServices],
})
export class PackagesModule {}
