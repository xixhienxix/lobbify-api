import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { RoomImagesService } from '../services/s3.service';
import { RolesUserGuard } from 'src/guards/roles.user.guard';

class PresignDto {
  fileType: string;
  fileSize: number;
}

class ConfirmDto {
  key: string;
  isCover?: boolean;
}

class DeleteImageDto {
  key: string;
}

@Controller('rooms')
@UseGuards(RolesUserGuard)
export class RoomImagesController {
  constructor(private readonly roomImagesService: RoomImagesService) {}

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
