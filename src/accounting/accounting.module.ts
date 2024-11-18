import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountingController } from './controllers/accounting.controller';
import { AccountingService } from './services/accounting.service';
import { EdoCuentaSchema } from './models/accounting.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Edo_Cuenta', schema: EdoCuentaSchema },
    ]),
  ],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
