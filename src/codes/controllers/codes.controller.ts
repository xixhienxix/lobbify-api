import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { CodesService } from '../_services/codes.service';
import { CreateCodeDto } from '../_models/codes.model';

@Controller()
export class CodesController {
  constructor(private _codesService: CodesService) {}

  @Get('/codigos/getAll')
  @UseGuards(RolesUserGuard)
  async findAllRooms(): Promise<any> {
    return this._codesService.findAll();
  }

  @Post('/codigos/new')
  @UseGuards(RolesUserGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async newCodigo(@Body() codigo: CreateCodeDto): Promise<any> {
    return this._codesService.postNewCode(codigo);
  }

  @Get('estatus/all')
  @UseGuards(RolesUserGuard)
  async findAllEstatus(): Promise<any> {
    return this._codesService.findAllEstatus();
  }

  @Get('/folios/all')
  @UseGuards(RolesUserGuard)
  async findAllFolios(): Promise<any> {
    return this._codesService.findFolios();
  }

  @Get('/adicional/all')
  @UseGuards(RolesUserGuard)
  async findAllAdicionales(): Promise<any> {
    return this._codesService.findAdicional();
  }
}
