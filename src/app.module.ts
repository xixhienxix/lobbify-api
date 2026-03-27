import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RequestMiddleWare } from './auth/middleware/request-middleware';
import { HuespedController } from './auth/controllers/huesped.controller';
import { RoomsModule } from './rooms/rooms.module';
import { CodesModule } from './codes/codes.module';
import { DivisasModule } from './divisas/divisas.module';
import { TimezonesModule } from './timezones/timezones.module';
import { DisponibilidadModule } from './dispo/dispo.module';
import { TarifasModule } from './tarifas/tarifas.module';
import { GuestModule } from './guests/guest.module';
import { HouseKeepingModule } from './housekeepingcodes/housekeepingcodes.module';
import { ParametrosModule } from './parametros/parametros.module';
import { PromesasModule } from './promesas/promesas.module';
import { AccountingModule } from './accounting/accounting.module';
import { LogModule } from './activitylogs/logs.module';
import { BloqueosModule } from './bloqueos/bloqueos.module';
import { PromosModule } from './promos/promos.module';
import { MailService } from './mail/mail.service';
import { ConfigModule } from '@nestjs/config';
import { MailController } from './mail/email.controller';
import { PackagesModule } from './paquetes/paquetes.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { RoleFieldFilterInterceptor } from './interceptors/role-file-filter-interceptor';
import { BookingParametrosModule } from './booking/parametros.module';
import { TenantModule } from './tenant/tenant.module';
import { TenantMiddleware } from './tenant/tenant.middleware';
import { AdminModule } from './admin/admin.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ScheduleModule,
    AuthModule,
    PackagesModule,
    BloqueosModule,
    RoomsModule,
    CodesModule,
    DivisasModule,
    TarifasModule,
    TimezonesModule,
    GuestModule,
    DisponibilidadModule,
    HouseKeepingModule,
    ParametrosModule,
    PromesasModule,
    LogModule,
    PromosModule,
    AccountingModule,
    BookingParametrosModule,
    TenantModule,
    AdminModule,
  ],
  controllers: [AppController, MailController],
  providers: [
    AppService,
    MailService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RoleFieldFilterInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestMiddleWare).forRoutes(HuespedController);
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
