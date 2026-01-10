import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ParametrosService } from '../services/parametros.service';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { RoleFieldFilterInterceptor } from 'src/interceptors/role-file-filter-interceptor';
import { ADMIN_FIELDS } from 'src/constraints/admin-fields-constraints';
import { AdminOnlyFields } from 'src/decorators/admin-only-decorator';
import { UserRole } from 'src/decorators/user-role-decorator';

@Controller()
export class ParametrosController {
  constructor(private _parametrosService: ParametrosService) {}

  @Get('/parametros')
  @UseGuards(RolesUserGuard)
  @AdminOnlyFields(...ADMIN_FIELDS.PARAMETROS)
  async getParametros(
    @Req() request: Request,
    @UserRole() role: string,
  ): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._parametrosService.getAll(hotel, role, ADMIN_FIELDS.PARAMETROS);
  }

  @Post('/parametros/save')
  @UseGuards(RolesUserGuard)
  async postParametros(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._parametrosService.postParametros(hotel, body);
  }
}
