import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { RoomImagesService } from '../services/s3.service';

export class PresignDto {
  @IsString()
  fileType: string;

  @IsNumber()
  fileSize: number;
}

export class ConfirmDto {
  @IsString()
  key: string;

  @IsBoolean()
  @IsOptional()
  isCover?: boolean;
}

export class DeleteImageDto {
  @IsString()
  key: string;
}

@Controller('rooms')
export class RoomImagesController {
  constructor(private readonly roomImagesService: RoomImagesService) {}

  // ── NEW: GET images for a room (used by edit modal to load existing images) ──
  @Get(':codigo/images')
  getImages(@Param('codigo') codigo: string) {
    return this.roomImagesService.getImages(codigo);
  }

  @Post(':codigo/images/presign')
  getPresignedUrl(@Param('codigo') codigo: string, @Body() body: PresignDto) {
    return this.roomImagesService.getPresignedUrl(
      codigo,
      body.fileType,
      body.fileSize,
    );
  }

  @Post(':codigo/images/confirm')
  confirmUpload(@Param('codigo') codigo: string, @Body() body: ConfirmDto) {
    return this.roomImagesService.confirmUpload(
      codigo,
      body.key,
      body.isCover ?? false,
    );
  }

  @Delete(':codigo/images')
  deleteImage(@Param('codigo') codigo: string, @Body() body: DeleteImageDto) {
    return this.roomImagesService.deleteImage(codigo, body.key);
  }

  @Delete(':codigo/images/all')
  deleteAllImages(@Param('codigo') codigo: string) {
    return this.roomImagesService.deleteAllRoomImages(codigo);
  }
}
