import {
  BadRequestException,
  Controller,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Authorization } from "src/auth/decorators/authorization.decorator";
import { Authorized } from "src/auth/decorators/authorized.decorator";
import { MultipartGuard } from "./guards/multipart.guard";
import { UploadService } from "./upload.service";

@Authorization()
@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(MultipartGuard)
  @UseInterceptors(FileInterceptor("file"))
  async create(
    @Authorized("id") userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [],
        exceptionFactory: (errors) => {
          return new BadRequestException(
            "Файл не найден или не прошёл валидацию",
          );
        },
      }),
    ) //@ts-ignore
    file: Express.Multer.File,
  ) {
    return await this.uploadService.create(userId, file);
  }
}
