import { Module, forwardRef } from '@nestjs/common';
import { ParametrosController } from './controllers/parametros.controller';
import { ParametrosService } from './services/parametros.service';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [forwardRef(() => SchedulerModule)],
  controllers: [ParametrosController],
  providers: [ParametrosService],
  exports: [ParametrosService],
})
export class ParametrosModule {}
