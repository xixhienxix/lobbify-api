import { Controller, Get, Req } from '@nestjs/common';
import { ParametrosService } from '../_services/parameters.service';
import { Parameters } from '../_models/parameters.model';

@Controller()
export class ParametrosController {
  constructor(private _parametrosService: ParametrosService) {}

  @Get('/booking/parameters')
  async findAll(@Req() req: Request): Promise<Parameters> {
    const hotel = req.headers['hotel'];
    return this._parametrosService.getAll(hotel);
  }
}
