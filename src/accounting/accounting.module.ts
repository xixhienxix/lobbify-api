import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountingController } from './controllers/accounting.controller';
import { AccountingService } from './services/accounting.service';
import { EdoCuentaSchema } from './models/accounting.model';
import { GuestSchema, huespeds } from 'src/guests/models/guest.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Edo_Cuenta', schema: EdoCuentaSchema },
      { name: huespeds.name, schema: GuestSchema },
    ]),
  ],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
