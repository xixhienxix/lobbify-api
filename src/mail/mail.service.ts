import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailModel } from './email.model';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendEmail(payload: EmailModel) {
    const { to, subject, reservationCode, nombre, folio, llegada, salida } =
      payload;

    // Use the from address from env, do not trust frontend for 'from'
    const from = this.configService.get<string>('EMAIL_FROM');

    const html = `
      <h2>Hola ${nombre},</h2>
      <p>Gracias por tu preferencia.</p>
      <p>Tus reservaciones cuentan con los siguientes folios: ${folio}.</p>
      <p>Tienes una fecha de llegada del: ${llegada}.</p>
      <p>y una fecha de salida de: ${salida}.</p>
      <p>Tu código de reservación es: <strong>${reservationCode}</strong></p>
    `;

    const mailOptions = {
      from,
      to,
      subject,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return {
        message: 'Email sent successfully',
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new HttpException(
        'Failed to send email. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
