import { Module } from '@nestjs/common';
import { LoginController } from './controllers/login.controller';
import { HotelsController } from './controllers/hotels.controller';
import { UserService } from './service/user.service';
import { AutorizaController } from './controllers/autoriza.controller';
import { TenantModule } from 'src/tenant/tenant.module';
import { UsersController } from './usuarios.controller';

@Module({
  controllers: [
    LoginController,
    HotelsController,
    AutorizaController,
    UsersController,
  ],
  providers: [UserService],
  imports: [TenantModule],
})
export class AuthModule {}
