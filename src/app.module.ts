import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from './environments/environment';
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

@Module({
  imports: [
    AuthModule,
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
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/MovNext', {
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          console.log('✅ Connected to MongoDB');
        });
        connection.on('error', (error) => {
          console.error('❌ MongoDB connection error:', error);
        });
        connection.on('disconnected', () => {
          console.warn('⚠️ MongoDB connection disconnected');
        });
        return connection;
      },
      // MongoDB options
      retryAttempts: 10, // Retry 10 times
      retryDelay: 5000, // Retry every 5 seconds
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestMiddleWare).forRoutes(HuespedController);
  }
}
