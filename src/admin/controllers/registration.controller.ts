import { Body, Controller, Post } from '@nestjs/common';
import { RegistrationService } from '../services/registration.service';
import { RegisterHotelDto } from '../models/dto/register-hotel.dto';

@Controller('register')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post()
  async registerHotel(@Body() body: RegisterHotelDto) {
    return this.registrationService.registerHotel(body);
  }
}
