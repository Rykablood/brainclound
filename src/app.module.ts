import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PostsModule } from "./posts/posts.module";
import { PrismaService } from "./prisma.service";
import { S3Module } from "./s3/s3.module";
import { UploadModule } from './upload/upload.module';
import { LecturesModule } from './lectures/lectures.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    AuthModule,
    S3Module,
    PostsModule,
    UploadModule,
    LecturesModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
