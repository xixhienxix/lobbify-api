import { Controller, Get } from '@nestjs/common';
import { UserService } from '../service/user.service';

@Controller()
export class HotelsController {
  constructor(private _authService: UserService) {}

  @Get('/listahoteles') //For testing Booking only, not use in PROD
  getHotelsList() {
    return this._authService.findHotels();
  }
}
