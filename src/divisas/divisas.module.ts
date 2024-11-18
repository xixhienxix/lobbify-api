import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DivisasController } from './controllers/divisas.controller';
import { DivisasService } from './_services/divisas.service';
import { DivisasSchema, divisa } from './_models/divisas.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: divisa.name, schema: DivisasSchema }]),
  ],
  controllers: [DivisasController],
  providers: [DivisasService],
})
export class DivisasModule {}
