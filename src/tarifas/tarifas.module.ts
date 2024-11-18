import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TarifasSchema, tarifas } from './_models/tarifas.model';
import { TarifasController } from './_controllers/tarifas.controller';
import { TarifasService } from './_services/tarifas.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: tarifas.name, schema: TarifasSchema }]),
  ],
  controllers: [TarifasController],
  providers: [TarifasService],
})
export class TarifasModule {}
