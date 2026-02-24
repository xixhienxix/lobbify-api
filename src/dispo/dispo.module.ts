import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DisponibilidadSchema, disponibilidad } from './_models/dispo.model';
import { DispoController } from './_controllers/dispo.controller';
import { DisponibilidadService } from './_services/dispo.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: disponibilidad.name, schema: DisponibilidadSchema },
    ]),
    forwardRef(() => ScheduleModule),
  ],
  controllers: [DispoController],
  providers: [DisponibilidadService],
})
export class DisponibilidadModule {}
