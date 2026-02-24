import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParametrosController } from './controllers/parameters.controller';
import { ParametrosService } from './_services/parameters.service';
import { Parameters, ParametersSchema } from './_models/parameters.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Parameters.name, schema: ParametersSchema },
    ]),
  ],
  controllers: [ParametrosController],
  providers: [ParametrosService],
  exports: [ParametrosService],
})
export class BookingParametrosModule {}
