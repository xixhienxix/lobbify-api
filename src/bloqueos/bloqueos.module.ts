import { Module } from '@nestjs/common';
import { BloqueosController } from './_controllers/bloqueos.controller';
import { BloqueosService } from './_services/bloqueos.service';

@Module({
  controllers: [BloqueosController],
  providers: [BloqueosService],
  exports: [BloqueosService],
})
export class BloqueosModule {}
