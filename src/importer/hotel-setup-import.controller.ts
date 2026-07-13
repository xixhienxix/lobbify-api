// hotel-setup-import.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportHotelSetupDto } from '../importer/models/import-hotel-setup.dto';
import { HotelSetupImportService } from './hotel-setup-import.service';
import { MasterAdminGuard } from '../guards/master-admin.guard';

import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

@Controller('hotel-setup')
@UseGuards(MasterAdminGuard) // exige JWT verificado (firma real) + rol=1 y perfil=1 en MovNext
export class HotelSetupImportController {
  constructor(private readonly importService: HotelSetupImportService) {}

  /**
   * OPCIÓN A — JSON ya parseado en el body.
   * POST /hotel-setup/import
   * Header: Authorization: <jwt de /hotel-setup/master-login, SIN "Bearer">
   */
  @Post('import')
  @UsePipes(new ValidationPipe({ whitelist: false, transform: true }))
  async importSetup(@Body() dto: ImportHotelSetupDto) {
    return this.runImport(dto);
  }

  /**
   * OPCIÓN B — archivo .json subido (la que usa el botón "Importar" del panel).
   * POST /hotel-setup/import-file
   * Content-Type: multipart/form-data
   * Header: Authorization: <jwt de /hotel-setup/master-login, SIN "Bearer">
   * Campos: file (requerido), hotelSlugOverride/adminPassword/upsert (query, opcionales)
   */
  @Post('import-file')
  @UseInterceptors(FileInterceptor('file'))
  async importSetupFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('hotelSlugOverride') hotelSlugOverride?: string,
    @Query('adminPassword') adminPassword?: string,
    @Query('upsert') upsert?: string,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No se recibió ningún archivo. Manda el JSON en el campo "file".',
      );
    }

    let setupJson: any;
    try {
      setupJson = JSON.parse(file.buffer.toString('utf-8'));
    } catch (err) {
      throw new BadRequestException(
        `El archivo no es un JSON válido: ${(err as Error).message}`,
      );
    }

    return this.runImport({
      setupJson,
      hotelSlugOverride,
      adminPassword,
      upsert: upsert === undefined ? true : upsert === 'true',
    });
  }

  private async runImport(dto: ImportHotelSetupDto) {
    const summary = await this.importService.importSetup(dto);
    return {
      success: true,
      message: `Hotel "${summary.hotelId}" importado correctamente.`,
      summary,
    };
  }
}
