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
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { Authorization } from "src/auth/decorators/authorization.decorator";
import { Authorized } from "src/auth/decorators/authorized.decorator";
import { MultipartGuard } from "./guards/multipart.guard";
import { UploadService } from "./upload.service";

@Authorization()
@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  @ApiOperation({ summary: "Загрузка файла на сервер" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Файл для загрузки (изображение, документ и т.д.)",
        },
      },
      required: ["file"],
    },
    description: "Form-data с полем 'file'",
  })
  @ApiResponse({
    status: 201,
    description: "Файл успешно загружен",
    schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          format: "uuid",
          example: "932fc79e-4e46-4ce1-8d3f-c4421183c839",
        },
        url: {
          type: "string",
          format: "uri",
          example: "https://s3.ru1.storage.beget.cloud/.../white.png",
        },
        mimeType: { type: "string", example: "image/png" },
        originalName: { type: "string", example: "white.png" },
        userId: {
          type: "string",
          format: "uuid",
          example: "cmoj3ph7h0000ecvek2bq3w7p",
        },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Файл не найден, не прошёл валидацию или неверный формат",
  })
  @ApiResponse({
    status: 401,
    description: "Неавторизованный запрос (отсутствует или невалиден JWT)",
  })
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
