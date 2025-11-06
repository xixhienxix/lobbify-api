import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GuestService } from './services/guest.service';
import {
  GuestSchema,
  HuespedDetailsSchema,
  PromesasSchema,
  huespeds,
} from './models/guest.model';
import { GuestsController } from './controllers/guest.controller';
import { EstatusSchema, FoliadorSchema } from 'src/codes/_models/codes.model';
import { BloqueosSchema } from 'src/bloqueos/_models/bloqueos.model';
import { BloqueosModule } from 'src/bloqueos/bloqueos.module';
import { GuestGateway } from './gateway/guest.gateway';

@Module({
  imports: [
    BloqueosModule,
    MongooseModule.forFeature([
      { name: huespeds.name, schema: GuestSchema },
      { name: 'Foliador', schema: FoliadorSchema },
      { name: 'Promesas', schema: PromesasSchema },
      { name: 'Detalles_Huesped', schema: HuespedDetailsSchema },
      { name: 'Estatus', schema: EstatusSchema },
      { name: 'Bloqueos', schema: BloqueosSchema }, // Ensure this matches
    ]),
  ],
  controllers: [GuestsController],
  providers: [GuestService, GuestGateway],
  exports: [GuestService],
})
export class GuestModule {}
