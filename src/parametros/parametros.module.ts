import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParametrosSchema } from './models/parametros.model';
import { ParametrosController } from './controllers/parametros.controller';
import { ParametrosService } from './services/parametros.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Parametros', schema: ParametrosSchema },
    ]),
  ],
  controllers: [ParametrosController],
  providers: [ParametrosService],
  exports: [ParametrosService],
})
export class ParametrosModule {}
