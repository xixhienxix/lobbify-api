// mail.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from './mail.service';
import { EmailModel } from './email.model';

@Controller('mail') // 👈 Important: sets base route to /mail
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send') // 👈 Handles POST /mail/send
  async sendEmail(@Body() payload: EmailModel) {
    await this.mailService.sendEmail(payload);
    return { message: 'Email sent successfully' };
  }
}
