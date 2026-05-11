import { S3Client } from "@aws-sdk/client-s3";
import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaService } from "src/prisma.service";
import { FilesService } from "./file.service";
import { S3_CLIENT_TOKEN } from "./s3.tokens";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: S3_CLIENT_TOKEN,
      useFactory: (config: ConfigService) => {
        return new S3Client({
          endpoint: config.getOrThrow("S3_ENDPOINT"),
          region: config.get("S3_REGION"),
          credentials: {
            accessKeyId: config.getOrThrow("S3_ACCESS_KEY_ID"),
            secretAccessKey: config.getOrThrow("S3_SECRET_ACCESS_KEY"),
          },
          forcePathStyle: true,
        });
      },
      inject: [ConfigService],
    },
    FilesService,
    PrismaService,
  ],
  exports: [S3_CLIENT_TOKEN, FilesService],
})
export class S3Module {}
