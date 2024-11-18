import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AdminGuard } from 'src/guards/admin.guard';
import { UserService } from '../service/user.service';

@Controller()
export class AutorizaController {
  constructor(private _userService: UserService) {}

  @Post('/auth/autoriza')
  @UseGuards(AdminGuard)
  async findAlLHuespeds(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._userService.autoriza(hotel, body);
  }
}
