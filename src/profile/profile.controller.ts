// profile.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Authorization } from "src/auth/decorators/authorization.decorator";
import { Authorized } from "src/auth/decorators/authorized.decorator";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ProfileService } from "./profile.service";

@ApiTags("profile") // 🔹 Группировка в Swagger UI
@ApiBearerAuth() // 🔹 Требует JWT в заголовке
@Authorization()
@Controller("profile")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // 🔹 Получить данные профиля текущего пользователя
  @Get()
  @ApiOperation({
    summary: "Получить данные профиля",
    description:
      "Возвращает полную информацию о профиле авторизованного пользователя: имя, username, email, роль, дату регистрации и счётчики контента.",
  })
  @ApiOkResponse({
    description: "Данные профиля успешно получены",
    schema: {
      example: {
        id: "user-uuid",
        name: "Алексей",
        username: "@alex80",
        email: "alex@example.com",
        role: "USER",
        createdAt: "2026-01-15T10:00:00.000Z",
        updatedAt: "2026-05-12T14:30:00.000Z",
        stats: {
          postsCount: 12,
          lecturesCount: 3,
          filesCount: 45,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Не авторизован" })
  async getProfile(@Authorized("id") id: string) {
    return await this.profileService.getProfile(id);
  }

  // 🔹 Получить файлы пользователя
  @Get("/files")
  @ApiOperation({
    summary: "Получить файлы пользователя",
    description:
      "Возвращает список всех файлов, загруженных текущим пользователем. Используется в менеджере файлов профиля.",
  })
  @ApiOkResponse({
    description: "Список файлов пользователя",
    schema: {
      example: [
        {
          id: "file-uuid",
          url: "https://s3.../image.png",
          mimeType: "image/png",
          originalName: "screenshot.png",
          size: 245678,
          createdAt: "2026-05-10T12:00:00.000Z",
          usedInPosts: 1,
          usedInLectures: 0,
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: "Не авторизован" })
  async getProfileFiles(@Authorized("id") id: string) {
    return await this.profileService.getProfileFiles(id);
  }

  // 🔹 Получить посты пользователя
  @Get("/posts")
  @ApiOperation({
    summary: "Получить посты пользователя",
    description:
      "Возвращает список постов, созданных текущим пользователем. Включает статус, счётчики и теги.",
  })
  @ApiOkResponse({
    description: "Список постов пользователя",
    schema: {
      example: [
        {
          id: "post-uuid",
          title: "Мой первый пост",
          status: "APPROVED",
          filesCount: 3,
          tags: ["личное", "новости"],
          createdAt: "2026-05-10T12:00:00.000Z",
          updatedAt: "2026-05-11T09:00:00.000Z",
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: "Не авторизован" })
  async getProfilePosts(@Authorized("id") id: string) {
    return await this.profileService.getProfilePosts(id);
  }

  // 🔹 Получить лекции пользователя
  @Get("/lectures")
  @ApiOperation({
    summary: "Получить лекции пользователя",
    description:
      "Возвращает список лекций, созданных текущим пользователем. Включает превью, статус, счётчики постов/файлов и теги.",
  })
  @ApiOkResponse({
    description: "Список лекций пользователя",
    schema: {
      example: [
        {
          id: "lecture-uuid",
          title: "Введение в NestJS",
          preview: "https://s3.../preview.jpg",
          status: "APPROVED",
          postsCount: 2,
          filesCount: 5,
          tags: ["nestjs", "backend"],
          createdAt: "2026-05-08T15:00:00.000Z",
          updatedAt: "2026-05-09T10:00:00.000Z",
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: "Не авторизован" })
  async getProfileCourses(@Authorized("id") id: string) {
    return await this.profileService.getProfileLectures(id);
  }

  // 🔹 Обновить данные профиля
  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Обновить данные профиля",
    description:
      "Позволяет авторизованному пользователю обновить своё имя, username или роль (последнее — только для ADMIN/DEVELOPER). Возвращает обновлённые данные профиля.",
  })
  @ApiOkResponse({
    description: "Профиль успешно обновлён",
    schema: {
      example: {
        message: "Данные профиля успешно обновлены",
        user: {
          id: "user-uuid",
          name: "Алексей Иванов",
          username: "alex_ivanov",
          email: "alex@example.com",
          role: "USER",
          updatedAt: "2026-05-12T14:30:00.000Z",
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: "Некорректные данные в запросе" })
  @ApiUnauthorizedResponse({ description: "Не авторизован" })
  @ApiForbiddenResponse({ description: "Недостаточно прав для смены роли" })
  async updateProfile(
    @Authorized("id") id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return await this.profileService.updateProfile(id, dto);
  }
}
