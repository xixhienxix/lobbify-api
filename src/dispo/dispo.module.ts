import { forwardRef, Module } from '@nestjs/common';
import { DispoController } from './_controllers/dispo.controller';
import { DisponibilidadService } from './_services/dispo.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [forwardRef(() => ScheduleModule)],
  controllers: [DispoController],
  providers: [DisponibilidadService],
})
export class DisponibilidadModule {}
