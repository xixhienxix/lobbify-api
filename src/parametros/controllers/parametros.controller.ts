import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ParametrosService } from '../services/parametros.service';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { ADMIN_FIELDS } from 'src/constraints/admin-fields-constraints';
import { AdminOnlyFields } from 'src/decorators/admin-only-decorator';
import { UserRole } from 'src/decorators/user-role-decorator';

@Controller()
export class ParametrosController {
  constructor(private _parametrosService: ParametrosService) {}

  @Get('/parametros')
  @UseGuards(RolesUserGuard)
  @AdminOnlyFields(...ADMIN_FIELDS.PARAMETROS)
  async getParametros(@UserRole() role: string): Promise<any> {
    return this._parametrosService.getAll(role, ADMIN_FIELDS.PARAMETROS);
  }

  @Post('/parametros/save')
  @UseGuards(RolesUserGuard)
  async postParametros(@Body() body) {
    return this._parametrosService.postParametros(body);
  }
}
