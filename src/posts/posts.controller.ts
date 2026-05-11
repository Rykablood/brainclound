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
import { CreatePostDto } from "./dto/create-post.dto";
import { FindAllPostDto } from "./dto/findAll-post.dto";
import { FindPostByContentDto } from "./dto/findByContent-post.dto";
import { PostsService } from "./posts.service";

@ApiTags("posts") // 🔹 Группировка в Swagger UI
@ApiBearerAuth() // 🔹 Требует JWT в заголовке
@Authorization()
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // 🔹 Создание поста
  @Post()
  @ApiOperation({
    summary: "Создать новый пост",
    description:
      "Создаёт пост с заголовком, текстом и опциональными файлами/тегами. Доступно только авторизованным пользователям.",
  })
  @ApiCreatedResponse({
    description: "Пост успешно создан",
    schema: {
      example: {
        id: "post-uuid",
        title: "Мой первый пост",
        text: "<p>Текст поста...</p>",
        userId: "user-uuid",
        status: "PREVIEW",
        createdAt: "2026-05-12T10:00:00.000Z",
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Не авторизован" })
  @ApiForbiddenResponse({ description: "Недостаточно прав" })
  async create(@Authorized("id") userId: string, @Body() dto: CreatePostDto) {
    return await this.postsService.create(userId, dto);
  }

  // 🔹 Получение постов (с пагинацией и фильтром)
  @Get()
  @ApiOperation({
    summary: "Получить список постов",
    description:
      "Возвращает список постов с пагинацией. Можно фильтровать по userId для получения постов конкретного пользователя.",
  })
  @ApiQuery({
    name: "userId",
    required: false,
    type: String,
    example: "user-uuid",
  })
  @ApiQuery({ name: "skip", required: false, type: Number, example: 0 })
  @ApiQuery({ name: "take", required: false, type: Number, example: 10 })
  @ApiOkResponse({
    description: "Список постов",
    schema: {
      example: [
        {
          id: "post-uuid",
          title: "Мой первый пост",
          authorName: "Алексей",
          authorUsername: "@alex80",
          filesCount: 3,
          tags: ["личное", "новости"],
          createdAt: "2026-05-12T10:00:00.000Z",
        },
      ],
    },
  })
  async findAll(@Query() dto: FindAllPostDto) {
    return await this.postsService.findAll(dto);
  }

  // 🔹 Поиск постов по контенту
  @Get("find")
  @ApiOperation({
    summary: "Поиск постов",
    description:
      "Поиск постов по заголовку, тексту или тегам. Возвращает компактные данные для отображения в результатах поиска.",
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
          id: "post-uuid",
          title: "Гайд по NestJS",
          authorName: "Алексей",
          authorUsername: "@alex80",
          filesCount: 2,
          tags: ["nestjs", "backend", "tutorial"],
        },
      ],
    },
  })
  async findByContent(@Query() dto: FindPostByContentDto) {
    return await this.postsService.findByContent(dto);
  }

  // 🔹 Последние 3 поста (для главной страницы)
  @Get("last")
  @ApiOperation({
    summary: "Получить последние 3 поста",
    description:
      "Возвращает 3 самых свежих одобренных поста для отображения на главной странице.",
  })
  @ApiOkResponse({
    description: "Массив из 3 постов",
    schema: {
      example: [
        {
          id: "post-uuid",
          title: "Мой первый пост",
          authorName: "Алексей",
          authorUsername: "@alex80",
          filesCount: 3,
          tags: ["личное", "новости"],
        },
      ],
    },
  })
  async getLastPosts() {
    return await this.postsService.getLastPosts();
  }

  // 🔹 Получить пост по ID
  @Get(":id")
  @ApiOperation({
    summary: "Получить пост по ID",
    description: "Возвращает полные данные поста, включая файлы и теги.",
  })
  @ApiParam({
    name: "id",
    description: "UUID поста",
    example: "post-uuid-here",
  })
  @ApiOkResponse({
    description: "Данные поста",
    schema: {
      example: {
        id: "post-uuid",
        title: "Мой первый пост",
        text: "<p>Текст поста...</p>",
        user: {
          id: "user-uuid",
          name: "Алексей",
          username: "@alex80",
        },
        files: [
          {
            id: "file-uuid",
            url: "https://.../image.png",
            mimeType: "image/png",
            originalName: "screenshot.png",
          },
        ],
        tags: ["личное", "новости"],
        status: "APPROVED",
        createdAt: "2026-05-12T10:00:00.000Z",
        updatedAt: "2026-05-12T10:00:00.000Z",
      },
    },
  })
  @ApiNotFoundResponse({ description: "Пост не найден" })
  async findOne(@Param("id") id: string) {
    return await this.postsService.findOne(id);
  }

  // 🔹 Удалить пост
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Удалить пост",
    description:
      "Удаляет пост по ID. Доступно только автору поста или администратору. Возвращает 204 No Content при успехе.",
  })
  @ApiParam({
    name: "id",
    description: "UUID поста для удаления",
    example: "post-uuid-here",
  })
  @ApiOkResponse({
    description: "Пост успешно удалён (204 No Content)",
  })
  @ApiUnauthorizedResponse({ description: "Не авторизован" })
  @ApiForbiddenResponse({ description: "Недостаточно прав" })
  @ApiNotFoundResponse({ description: "Пост не найден" })
  async remove(@Authorized("id") userId: string, @Param("id") postId: string) {
    await this.postsService.remove(userId, postId);
  }
}
