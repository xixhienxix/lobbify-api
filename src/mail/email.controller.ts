// mail.controller.ts
import { Controller, Post, Body, Req } from '@nestjs/common';
import { MailService } from './mail.service';
import { EmailModel } from './email.model';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  async sendEmail(@Req() req: any, @Body() payload: EmailModel) {
    // hotelId and dbConnection are set by TenantMiddleware
    return this.mailService.sendEmail(req.hotelId, req.dbConnection, payload);
  }
}
