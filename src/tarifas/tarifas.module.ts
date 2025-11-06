import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TarifasSchema, tarifas } from './_models/tarifas.model';
import { TarifasController } from './_controllers/tarifas.controller';
import { TarifasService } from './_services/tarifas.service';
import { RatesGateway } from './_gateway/rates.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: tarifas.name, schema: TarifasSchema }]),
  ],
  controllers: [TarifasController],
  providers: [TarifasService, RatesGateway],
})
export class TarifasModule {}
