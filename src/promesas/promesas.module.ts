import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Promesas, PromesasSchema } from './models/promesas.model';
import { PromesasService } from './services/promesas.services';
import { PromesasController } from './controllers/promesas.controller';
import { PromesasGateWay } from './gateway/promesas.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Promesas.name, schema: PromesasSchema },
    ]),
  ],
  controllers: [PromesasController],
  providers: [PromesasService, PromesasGateWay],
})
export class PromesasModule {}
