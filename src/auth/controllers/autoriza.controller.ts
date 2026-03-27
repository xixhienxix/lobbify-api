import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from 'src/guards/admin.guard';
import { UserService } from '../service/user.service';

@Controller()
export class AutorizaController {
  constructor(private _userService: UserService) {}

  @Post('/auth/autoriza')
  @UseGuards(AdminGuard)
  async findAlLHuespeds(@Body() body) {
    return this._userService.autoriza(body);
  }
}
