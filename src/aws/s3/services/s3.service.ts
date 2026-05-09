import {
  Injectable,
  Scope,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import {
  room,
  RoomsSchema,
  RoomImage,
} from '../../../rooms/models/rooms.model';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable({ scope: Scope.REQUEST })
export class RoomImagesService {
  private habitacionModel: Model<room>;
  private s3: S3Client;
  private bucket: string;
  private cdnUrl: string;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    // Same multi-tenant pattern as RoomsService
    const connection: Connection = (request as any).dbConnection;

    this.habitacionModel =
      connection.models['Habitaciones'] ||
      connection.model('Habitaciones', RoomsSchema);

    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });

    this.bucket = process.env.AWS_S3_BUCKET;
    this.cdnUrl = process.env.CLOUDFRONT_URL;
  }

  async getPresignedUrl(codigo: string, fileType: string, fileSize: number) {
    if (!ALLOWED_TYPES.includes(fileType)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${fileType}`,
      );
    }
    if (fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException('Archivo muy grande. Máximo 10MB');
    }

    const extension = fileType.split('/')[1];
    const uniqueId = uuid();
    const safeCode = codigo.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const key = `rooms/${safeCode}/original_${uniqueId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });

    // Strip checksum params the AWS SDK v3 adds by default —
    // these cause 403 Forbidden because the browser fetch PUT
    // doesn't send the matching checksum header
    const cleanUrl = new URL(uploadUrl);
    cleanUrl.searchParams.delete('x-amz-checksum-algorithm');
    cleanUrl.searchParams.delete('x-amz-sdk-checksum-algorithm');

    return {
      uploadUrl: cleanUrl.toString(),
      key,
      finalUrl: `${this.cdnUrl}/${key}`,
    };
  }

  async confirmUpload(codigo: string, key: string, isCover: boolean) {
    const exists = await this.habitacionModel.findOne({ Codigo: codigo });
    if (!exists) {
      throw new NotFoundException(`Habitación ${codigo} no encontrada`);
    }

    const imageEntry: RoomImage = {
      key,
      thumbKey: key.replace(/original_(.+)\..+$/, 'thumb_$1.webp'),
      mediumKey: key.replace(/original_(.+)\..+$/, 'medium_$1.webp'),
      largeKey: key.replace(/original_(.+)\..+$/, 'large_$1.webp'),
      isCover: isCover || false,
      uploadedAt: new Date(),
    };

    if (isCover) {
      await this.habitacionModel.updateMany(
        { Codigo: codigo },
        { $set: { 'images.$[].isCover': false } },
      );
    }

    await this.habitacionModel.updateMany(
      { Codigo: codigo },
      { $push: { images: imageEntry } },
    );

    return { message: 'Imagen confirmada', image: imageEntry };
  }

  async deleteImage(codigo: string, key: string) {
    const folder = key.substring(0, key.lastIndexOf('/'));
    const baseName = key
      .split('/')
      .pop()
      .replace('original_', '')
      .split('.')[0];

    const keysToDelete = [
      key,
      `${folder}/thumb_${baseName}.webp`,
      `${folder}/medium_${baseName}.webp`,
      `${folder}/large_${baseName}.webp`,
    ];

    await this.s3.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: keysToDelete.map((Key) => ({ Key })) },
      }),
    );

    await this.habitacionModel.updateMany(
      { Codigo: codigo },
      { $pull: { images: { key } } },
    );

    return { message: 'Imagen eliminada' };
  }

  async deleteAllRoomImages(codigo: string) {
    const safeCode = codigo.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const prefix = `rooms/${safeCode}/`;

    const listed = await this.s3.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }),
    );

    if (listed.Contents?.length) {
      await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: listed.Contents.map((obj) => ({ Key: obj.Key })) },
        }),
      );
    }

    await this.habitacionModel.updateMany(
      { Codigo: codigo },
      { $set: { images: [] } },
    );

    return { message: 'Todas las imágenes eliminadas' };
  }
}
