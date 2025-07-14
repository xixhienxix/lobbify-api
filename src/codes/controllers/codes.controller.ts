import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { CodesService } from '../_services/codes.service';
import { code, CreateCodeDto } from '../_models/codes.model';

@Controller()
export class CodesController {
  constructor(private _codesService: CodesService) {}

  @Get('/codigos/getAll')
  @UseGuards(RolesUserGuard)
  async findAllRooms(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._codesService.findAll(hotel);
  }
  @Post('/codigos/new')
  @UseGuards(RolesUserGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async newCodigo(
    @Req() request: Request,
    @Body() codigo: CreateCodeDto,
  ): Promise<any> {
    const hotel = request.headers['hotel'] as string;

    return this._codesService.postNewCode(codigo, hotel);
  }

  @Get('estatus/all')
  @UseGuards(RolesUserGuard)
  async findAllEstatus(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._codesService.findAllEstatus(hotel);
  }

  @Get('/folios/all')
  @UseGuards(RolesUserGuard)
  async findAllFolios(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._codesService.findFolios(hotel);
  }

  @Get('/adicional/all')
  @UseGuards(RolesUserGuard)
  async findAllAdicionales(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._codesService.findAdicional(hotel);
  }
}
