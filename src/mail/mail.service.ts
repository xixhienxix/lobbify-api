import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailModel } from './email.model';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { TenantService } from 'src/tenant/tenant.service';
import { Connection, Model } from 'mongoose';
import {
  Parametros,
  ParametrosSchema,
} from 'src/parametros/models/parametros.model';
import { decryptSecret } from 'src/tenant/secret.utils';
@Injectable()
export class MailService {
  private transporter;
  // Platform sender (Lobify welcome emails) — still uses env
  private platformTransporter;
  // Per-hotel transporters, rebuilt automatically if credentials change
  private hotelTransporters = new Map<
    string,
    { transporter: any; user: string; pass: string }
  >();

  constructor(
    private configService: ConfigService,
    private tenantService: TenantService,
  ) {
    this.platformTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async onModuleInit() {
    try {
      await this.platformTransporter.verify();
      console.log('✅ Platform SMTP ready');
    } catch (e: any) {
      console.error('❌ Platform SMTP verify failed:', e.code, e.response);
    }
  }

  /** Reads the hotel's own sender from its Parametros. Null if not configured. */
  private async getHotelSender(hotelId: string, connection: Connection) {
    try {
      const model: Model<Parametros> =
        (connection.models['Parametros'] as Model<Parametros>) ||
        connection.model('Parametros', ParametrosSchema);

      const p: any = await model
        .findOne()
        .select('+emailPass emailUser')
        .lean()
        .exec();

      if (!p?.emailUser?.trim() || !p?.emailPass) return null;

      const user = p.emailUser.trim();
      const pass = decryptSecret(p.emailPass);

      let entry = this.hotelTransporters.get(hotelId);
      if (!entry || entry.user !== user || entry.pass !== pass) {
        entry = {
          transporter: nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass },
          }),
          user,
          pass,
        };
        this.hotelTransporters.set(hotelId, entry);
      }
      return { transporter: entry.transporter, user };
    } catch (e: any) {
      console.error(`Could not load mail config for ${hotelId}:`, e.message);
      return null;
    }
  }

  private async getHotelTransporter(hotelId: string) {
    const cfg = await this.tenantService.getHotelMailConfig(hotelId);
    if (!cfg) {
      throw new HttpException(
        `Email credentials are not configured for hotel "${hotelId}"`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    let entry = this.hotelTransporters.get(hotelId);
    if (!entry || entry.user !== cfg.user || entry.pass !== cfg.pass) {
      entry = {
        transporter: nodemailer.createTransport({
          service: 'gmail',
          auth: { user: cfg.user, pass: cfg.pass },
        }),
        user: cfg.user,
        pass: cfg.pass,
      };
      this.hotelTransporters.set(hotelId, entry);
    }

    return {
      transporter: entry.transporter,
      user: entry.user,
      hotelNombre: cfg.nombre,
    };
  }

  async sendEmail(
    hotelId: string,
    connection: Connection,
    payload: EmailModel,
  ) {
    const { to, subject, reservationCode, nombre, folio, llegada, salida } =
      payload;

    const hotelNombre = await this.tenantService.getHotelNombre(hotelId);

    const formatDate = (iso: string): string => {
      const dt = DateTime.fromISO(iso);
      return dt.isValid ? dt.setLocale('es').toFormat('dd MMMM yyyy') : iso;
    };

    const html = `
      <h2>Hola ${nombre},</h2>
      <p>Gracias por elegir <strong>${hotelNombre}</strong>.</p>
      <p>Tus reservaciones cuentan con los siguientes folios: <strong>${folio}</strong>.</p>
      <p>Fecha de llegada: <strong>${formatDate(llegada)}</strong>.</p>
      <p>Fecha de salida: <strong>${formatDate(salida)}</strong>.</p>
      <p>Tu código de reservación es: <strong>${reservationCode}</strong></p>
    `;

    // 1) Try the hotel's own email
    const hotelSender = await this.getHotelSender(hotelId, connection);
    if (hotelSender) {
      try {
        const info = await hotelSender.transporter.sendMail({
          from: `"${hotelNombre}" <${hotelSender.user}>`,
          to,
          subject,
          html,
        });
        return {
          message: 'Email sent successfully',
          via: 'hotel',
          messageId: info.messageId,
        };
      } catch (error: any) {
        console.error('Hotel SMTP failed, falling back to platform:', {
          hotelId,
          code: error.code,
          response: error.response,
        });
      }
    }

    // 2) Fallback: platform account from .env
    try {
      const info = await this.platformTransporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to,
        subject,
        html,
      });
      return {
        message: 'Email sent successfully',
        via: 'platform',
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error('Platform SMTP failed:', {
        code: error.code,
        response: error.response,
      });
      throw new HttpException(
        'Failed to send email. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendWelcomeEmail(payload: {
    to: string;
    nombre: string;
    password: string;
    hotelId: string;
    loginUrl: string;
  }) {
    const from = this.configService.get<string>('EMAIL_FROM');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e1e2d; padding: 32px; text-align: center;">
          <h1 style="color: #009ef7; margin: 0;">Lobify</h1>
          <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 13px;">
            La solución simple para hoteles pequeños
          </p>
        </div>

        <div style="padding: 40px 32px; background: #ffffff;">
          <h2 style="color: #181c32; margin-bottom: 8px;">¡Tu hotel está listo, ${payload.nombre}!</h2>
          <p style="color: #7e8299; line-height: 1.6;">
            Tu hotel ha sido registrado exitosamente en Lobify. 
            Ya puedes iniciar sesión y comenzar a configurar tus habitaciones.
          </p>

          <div style="background: #f5f8fa; border-radius: 10px; padding: 24px; margin: 28px 0;">
            <p style="margin: 0 0 12px; font-size: 12px; font-weight: 700; 
               text-transform: uppercase; letter-spacing: 0.08em; color: #a1a5b7;">
              Tus credenciales de acceso
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #7e8299; font-size: 14px; width: 40%;">Usuario</td>
                <td style="padding: 8px 0; color: #181c32; font-size: 14px; font-weight: 600;">
                  ${payload.to}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #7e8299; font-size: 14px;">Contraseña</td>
                <td style="padding: 8px 0; color: #181c32; font-size: 14px; font-weight: 600;">
                  ${payload.password}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #7e8299; font-size: 14px;">ID del hotel</td>
                <td style="padding: 8px 0; color: #181c32; font-size: 14px; 
                   font-family: monospace;">
                  ${payload.hotelId}
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${payload.loginUrl}"
               style="background: #009ef7; color: white; padding: 14px 36px; 
                      border-radius: 8px; text-decoration: none; font-weight: 600;
                      font-size: 15px; display: inline-block;">
              Ir al panel de administración
            </a>
          </div>

          <p style="color: #a1a5b7; font-size: 12px; line-height: 1.6; margin-top: 28px;">
            Por seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión.
            Si no solicitaste este registro, ignora este correo.
          </p>
        </div>

        <div style="background: #f5f8fa; padding: 20px 32px; text-align: center;">
          <p style="color: #a1a5b7; font-size: 12px; margin: 0;">
            © 2026 Lobify · La solución simple para hoteles pequeños
          </p>
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from,
        to: payload.to,
        subject: `¡Bienvenido a Lobify! Tu hotel ${payload.nombre} está listo`,
        html,
      });
      return { message: 'Welcome email sent', messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw — registration succeeded, email failure shouldn't block the response
      return { message: 'Email could not be sent', error };
    }
  }
}
