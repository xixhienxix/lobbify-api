import { Module } from '@nestjs/common';
import { AccountingController } from './controllers/accounting.controller';
import { AccountingService } from './services/accounting.service';
import { AccountingGateway } from './gateway/accounting.gateway';
import { TarifasModule } from 'src/tarifas/tarifas.module';
import { GuestStatementService } from 'src/reservations/guest.statement.service';

@Module({
  imports: [TarifasModule],
  controllers: [AccountingController],
  providers: [AccountingService, GuestStatementService, AccountingGateway],
  exports: [AccountingService],
})
export class AccountingModule {}
