import { Controller, Get } from '@nestjs/common';
import { ParametrosService } from '../_services/parameters.service';
import { Parameters } from '../_models/parameters.model';

@Controller()
export class ParametrosController {
  constructor(private _parametrosService: ParametrosService) {}

  @Get('/booking/parameters')
  async findAll(): Promise<Parameters> {
    return this._parametrosService.getAll();
  }
}
