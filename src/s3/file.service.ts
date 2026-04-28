import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { S3_CLIENT_TOKEN } from "./s3.tokens";

@Injectable()
export class FilesService {
  constructor(
    @Inject(S3_CLIENT_TOKEN) private readonly s3Client: S3Client,
    private config: ConfigService,
  ) {}

  /**
   * Возвращает ссылку в формате `https://s3.ru1.storage.beget.cloud/<backet>/<filekey>.<format>`
   *
   * @param userId - id пользователя
   * @param file - файл (Express.Multer.File)
   * @returns
   */
  async uploadToS3(
    userId: string,
    // @ts-ignore
    file: Express.Multer.File,
  ): Promise<string> {
    const fileKey = `upload/${userId}/${Date.now()}-${randomUUID()}-${file.originalname}`;
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.config.getOrThrow("AWS_S3_BUCKET"),
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return `${this.config.getOrThrow("S3_ENDPOINT")}/${this.config.getOrThrow("AWS_S3_BUCKET")}/${encodeURIComponent(fileKey)}`;
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.getOrThrow("AWS_S3_BUCKET"),
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }
}
