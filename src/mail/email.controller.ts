// mail.controller.ts
import { Controller, Post, Body, Headers } from '@nestjs/common';
import { MailService } from './mail.service';
import { EmailModel } from './email.model';

@Controller('mail') // 👈 Important: sets base route to /mail
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  async sendEmail(
    @Headers('x-hotel-id') hotelId: string,
    @Body() payload: EmailModel,
  ) {
    return this.mailService.sendEmail(hotelId, payload);
  }
}
