import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BloqueosController } from './_controllers/bloqueos.controller';
import { BloqueosService } from './_services/bloqueos.service';
import { BloqueosSchema } from './_models/bloqueos.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Bloqueos', schema: BloqueosSchema }]),
  ],
  controllers: [BloqueosController],
  providers: [BloqueosService],
  exports: [BloqueosService],
})
export class BloqueosModule {}
