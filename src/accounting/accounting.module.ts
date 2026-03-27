import { Module } from '@nestjs/common';
import { AccountingController } from './controllers/accounting.controller';
import { AccountingService } from './services/accounting.service';
import { AccountingGateway } from './gateway/accounting.gateway';

@Module({
  controllers: [AccountingController],
  providers: [AccountingService, AccountingGateway],
  exports: [AccountingService],
})
export class AccountingModule {}
