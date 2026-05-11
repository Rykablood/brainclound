import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Authorization } from "src/auth/decorators/authorization.decorator";
import { Authorized } from "src/auth/decorators/authorized.decorator";
import { CreateLectureDto } from "./dto/create-lecture.dto";
import { FindAllLecturesDto } from "./dto/find-all-lectures.dto";
import { FindLectureByContentDto } from "./dto/findByContent-lectures.dto";
import { GetLatestLecturesDto } from "./dto/get-latest-lectures.dto";
import { LecturesService } from "./lectures.service";

@ApiTags("lectures") // 🔹 Группировка в Swagger UI
@ApiBearerAuth() // 🔹 Требует JWT в заголовке
@Authorization()
@Controller("lectures")
export class LecturesController {
  constructor(private readonly lecturesService: LecturesService) {}

  // 🔹 Создание лекции
  @Post()
  @ApiOperation({
    summary: "Создать новую лекцию",
    description:
      "Создаёт лекцию с заголовком, текстом, превью и опциональными файлами/постами/тегами. Доступно только авторизованным пользователям.",
  })
  @ApiCreatedResponse({
    description: "Лекция успешно создана",
    schema: {
      example: {
        id: "lecture-uuid",
        title: "Введение в NestJS",
        text: "<p>Полный курс...</p>",
        preview: "https://.../preview.jpg",
        userId: "user-uuid",
        status: "PREVIEW",
        createdAt: "2026-05-12T10:00:00.000Z",
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Не авторизован" })
  @ApiForbiddenResponse({ description: "Недостаточно прав" })
  async create(
    @Authorized("id") userId: string,
    @Body() dto: CreateLectureDto,
  ) {
    return this.lecturesService.create(userId, dto);
  }

  // 🔹 Получение лекций (с пагинацией и фильтром)
  @Get()
  @ApiOperation({
    summary: "Получить список лекций",
    description:
      "Возвращает список лекций с пагинацией. Можно фильтровать по userId для получения лекций конкретного пользователя.",
  })
  @ApiQuery({ name: "skip", required: false, type: Number, example: 0 })
  @ApiQuery({ name: "take", required: false, type: Number, example: 10 })
  @ApiQuery({
    name: "userId",
    required: false,
    type: String,
    example: "user-uuid",
  })
  @ApiOkResponse({
    description: "Список лекций",
    schema: {
      example: [
        {
          id: "lecture-uuid",
          title: "Введение в NestJS",
          preview: "https://.../preview.jpg",
          authorName: "Алексей",
          authorUsername: "@alex80",
          filesCount: 5,
          postsCount: 2,
          tags: ["nestjs", "backend"],
          createdAt: "2026-05-12T10:00:00.000Z",
        },
      ],
    },
  })
  async findAll(@Query() dto: FindAllLecturesDto) {
    return this.lecturesService.findAll(dto);
  }

  // 🔹 Поиск лекций по контенту
  @Get("find")
  @ApiOperation({
    summary: "Поиск лекций",
    description:
      "Поиск лекций по заголовку, тексту или тегам. Возвращает компактные данные для отображения в результатах поиска.",
  })
  @ApiQuery({
    name: "content",
    required: false,
    type: String,
    example: "nestjs",
    description: "Строка поиска (макс. 256 символов)",
  })
  @ApiOkResponse({
    description: "Результаты поиска",
    schema: {
      example: [
        {
          id: "lecture-uuid",
          title: "Введение в NestJS",
          preview: "https://.../preview.jpg",
          authorName: "Алексей",
          authorUsername: "@alex80",
          filesCount: 5,
          postsCount: 2,
          tags: ["nestjs", "backend"],
        },
      ],
    },
  })
  async findByContent(@Query() dto: FindLectureByContentDto) {
    return await this.lecturesService.findByContent(dto);
  }

  // 🔹 Последние 3 лекции (для главной страницы)
  @Get("last")
  @ApiOperation({
    summary: "Получить последние 3 лекции",
    description:
      "Возвращает 3 самых свежих одобренных лекции для отображения на главной странице.",
  })
  @ApiOkResponse({
    description: "Массив из 3 лекций",
    schema: {
      example: [
        {
          id: "lecture-uuid",
          title: "Введение в NestJS",
          preview: "https://.../preview.jpg",
          authorName: "Алексей",
          authorUsername: "@alex80",
          filesCount: 5,
          postsCount: 2,
          tags: ["nestjs", "backend"],
        },
      ],
    },
  })
  async getLastPosts() {
    return await this.lecturesService.getLastLectures();
  }

  // 🔹 Последние лекции с пагинацией
  @Get("latest")
  @ApiOperation({
    summary: "Получить последние лекции с пагинацией",
    description:
      "Возвращает одобренные лекции с поддержкой пагинации (skip/take) для бесконечного скролла.",
  })
  @ApiQuery({ name: "skip", required: false, type: Number, example: 0 })
  @ApiQuery({
    name: "take",
    required: false,
    type: Number,
    example: 25,
    description: "Макс. 100",
  })
  @ApiOkResponse({
    description: "Пагинированный список лекций",
    schema: {
      example: [
        {
          id: "lecture-uuid",
          title: "Введение в NestJS",
          preview: "https://.../preview.jpg",
          authorName: "Алексей",
          authorUsername: "@alex80",
          filesCount: 5,
          postsCount: 2,
          tags: ["nestjs", "backend"],
          createdAt: "2026-05-12T10:00:00.000Z",
        },
      ],
    },
  })
  async getLatest(@Query() dto: GetLatestLecturesDto) {
    return await this.lecturesService.getLatest(dto);
  }

  // 🔹 Получить лекцию по ID
  @Get(":id")
  @ApiOperation({
    summary: "Получить лекцию по ID",
    description:
      "Возвращает полные данные лекции, включая файлы, посты и теги.",
  })
  @ApiParam({
    name: "id",
    description: "UUID лекции",
    example: "lecture-uuid-here",
  })
  @ApiOkResponse({
    description: "Данные лекции",
    schema: {
      example: {
        id: "lecture-uuid",
        title: "Введение в NestJS",
        text: "<p>Полный курс...</p>",
        preview: "https://.../preview.jpg",
        user: {
          id: "user-uuid",
          name: "Алексей",
          username: "@alex80",
        },
        files: [
          {
            id: "file-uuid",
            url: "https://.../file.pdf",
            mimeType: "application/pdf",
            originalName: "guide.pdf",
          },
        ],
        posts: [
          {
            id: "post-uuid",
            title: "Дополнительный материал",
            status: "APPROVED",
          },
        ],
        tags: ["nestjs", "backend"],
        createdAt: "2026-05-12T10:00:00.000Z",
        updatedAt: "2026-05-12T10:00:00.000Z",
      },
    },
  })
  @ApiNotFoundResponse({ description: "Лекция не найдена" })
  async findOne(@Param("id") id: string) {
    return this.lecturesService.findOne(id);
  }

  // 🔹 Удалить лекцию
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Удалить лекцию",
    description:
      "Удаляет лекцию по ID. Доступно только автору лекции или администратору. Возвращает 204 No Content при успехе.",
  })
  @ApiParam({
    name: "id",
    description: "UUID лекции для удаления",
    example: "lecture-uuid-here",
  })
  @ApiOkResponse({
    description: "Лекция успешно удалена (204 No Content)",
  })
  @ApiUnauthorizedResponse({ description: "Не авторизован" })
  @ApiForbiddenResponse({ description: "Недостаточно прав" })
  @ApiNotFoundResponse({ description: "Лекция не найдена" })
  async remove(
    @Authorized("id") userId: string,
    @Param("id") lectureId: string,
  ) {
    await this.lecturesService.remove(userId, lectureId);
  }
}
