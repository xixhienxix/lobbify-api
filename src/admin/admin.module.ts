import { Module } from '@nestjs/common';
import { RegistrationService } from './services/registration.service';
import { RegistrationController } from './controllers/registration.controller';
import { TenantModule } from 'src/tenant/tenant.module';
import { MailService } from 'src/mail/mail.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TenantModule, ConfigModule],
  controllers: [RegistrationController],
  providers: [RegistrationService, MailService],
})
export class AdminModule {}
