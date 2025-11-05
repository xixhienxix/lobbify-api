import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { promoSchema } from './models/promos.model';
import { PromosController } from './controllers/promos.controller';
import { PromosService } from './services/promos.services';
import { PromosGateway } from './gateway/promos.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Promos', schema: promoSchema }]),
  ],
  controllers: [PromosController],
  providers: [PromosService, PromosGateway],
})
export class PromosModule {}
