import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { promoSchema } from './models/promos.model';
import { PromosController } from './controllers/promos.controller';
import { PromosService } from './services/promos.services';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Promos', schema: promoSchema }]),
  ],
  controllers: [PromosController],
  providers: [PromosService],
})
export class PromosModule {}
