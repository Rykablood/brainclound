import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { Role } from "src/generated/prisma/enums";
import { GetUserDto } from "src/profile/dto/get-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Authorization()
@ApiTags("users") // 🔹 Группировка в Swagger UI
@ApiBearerAuth() // 🔹 Требует JWT (для защищённых эндпоинтов)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("search")
  @ApiOperation({
    summary: "Поиск пользователей",
    description:
      "Поиск пользователей по имени, username или email (email виден только админам). Возвращает компактные данные с счётчиками контента.",
  })
  @ApiQuery({
    name: "content",
    required: true,
    type: String,
    example: "alex",
    description: "Строка поиска (мин. 2 символа)",
  })
  @ApiQuery({ name: "skip", required: false, type: Number, example: 0 })
  @ApiQuery({ name: "take", required: false, type: Number, example: 20 })
  @ApiOkResponse({
    description: "Результаты поиска",
    schema: {
      example: {
        users: [
          {
            id: "user-uuid",
            name: "Алексей",
            username: "@alex80",
            role: "USER",
            createdAt: "2026-01-15T10:00:00.000Z",
            postsCount: 12,
            lecturesCount: 3,
            // email будет только если запросил ADMIN/DEVELOPER
          },
        ],
        total: 1,
      },
    },
  })
  async search(
    @Authorized("role") role: Role,
    @Query("content") content: string,
    @Query() dto: GetUserDto,
  ) {
    return await this.usersService.search(role, content, dto);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Получить данные пользователя",
    description:
      "Возвращает публичные данные пользователя: имя, username, роль, дату регистрации и счётчики постов/лекций.",
  })
  @ApiParam({
    name: "id",
    description: "UUID пользователя",
    example: "user-uuid-here",
  })
  @ApiOkResponse({
    description: "Данные пользователя",
    schema: {
      example: {
        id: "user-uuid",
        name: "Алексей",
        username: "@alex80",
        role: "USER",
        createdAt: "2026-01-15T10:00:00.000Z",
        postsCount: 12,
        lecturesCount: 3,
      },
    },
  })
  @ApiNotFoundResponse({ description: "Пользователь не найден" })
  async findOne(@Param("id") id: string) {
    return await this.usersService.findOne(id);
  }

  @Get(":id/lectures")
  @ApiOperation({
    summary: "Получить лекции пользователя",
    description:
      "Возвращает список одобренных лекций пользователя с пагинацией. Используется на странице профиля.",
  })
  @ApiParam({
    name: "id",
    description: "UUID пользователя",
    example: "user-uuid",
  })
  @ApiQuery({ name: "skip", required: false, type: Number, example: 0 })
  @ApiQuery({ name: "take", required: false, type: Number, example: 25 })
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
          createdAt: "2026-05-10T12:00:00.000Z",
        },
      ],
    },
  })
  async getUserLectures(@Param("id") userId: string, @Query() dto: GetUserDto) {
    return await this.usersService.getUserLectures(userId, dto);
  }

  @Get(":id/posts")
  @ApiOperation({
    summary: "Получить посты пользователя",
    description:
      "Возвращает список одобренных постов пользователя с пагинацией. Используется на странице профиля.",
  })
  @ApiParam({
    name: "id",
    description: "UUID пользователя",
    example: "user-uuid",
  })
  @ApiQuery({ name: "skip", required: false, type: Number, example: 0 })
  @ApiQuery({ name: "take", required: false, type: Number, example: 25 })
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
          createdAt: "2026-05-10T12:00:00.000Z",
        },
      ],
    },
  })
  async getUserPosts(@Param("id") userId: string, @Query() dto: GetUserDto) {
    return await this.usersService.getUserPosts(userId, dto);
  }

  @Delete(":id")
  @Authorization()
  @ApiOperation({
    summary: "Удалить пользователя",
    description:
      "Удаляет пользователя и весь его контент (посты, лекции, файлы). Доступно только администраторам и разработчикам.",
  })
  @ApiParam({
    name: "id",
    description: "UUID пользователя для удаления",
    example: "user-uuid-here",
  })
  @ApiOkResponse({
    description: "Пользователь успешно удалён",
    schema: {
      example: {
        message: "Пользователь успешно удалён",
        id: "user-uuid",
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Не авторизован" })
  @ApiForbiddenResponse({ description: "Недостаточно прав" })
  @ApiNotFoundResponse({ description: "Пользователь не найден" })
  async remove(@Authorized("role") role: Role, @Param("id") userId: string) {
    return await this.usersService.remove(role, userId);
  }

  @Post()
  @Authorization()
  @ApiOperation({
    summary: "Создать нового пользователя",
    description:
      "Создаёт пользователя с указанными данными. Доступно только администраторам и разработчикам. Пароль автоматически хэшируется.",
  })
  @ApiCreatedResponse({
    description: "Пользователь успешно создан",
    schema: {
      example: {
        message: "Пользователь успешно создан",
        user: {
          id: "user-uuid",
          name: "Новый Пользователь",
          username: "newuser",
          email: "new@example.com",
          role: "USER",
          createdAt: "2026-05-12T10:00:00.000Z",
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Не авторизован" })
  @ApiForbiddenResponse({ description: "Недостаточно прав" })
  @ApiForbiddenResponse({
    description: "Недостаточно прав для назначения этой роли",
  })
  async create(@Authorized("role") role: Role, @Body() dto: CreateUserDto) {
    return await this.usersService.create(role, dto);
  }

  @Patch(":id")
  @Authorization()
  @ApiOperation({
    summary: "Обновить данные пользователя",
    description:
      "Обновляет имя, email, username, пароль или роль пользователя. Доступно только администраторам и разработчикам. Пароль хэшируется автоматически.",
  })
  @ApiParam({
    name: "id",
    description: "UUID пользователя для обновления",
    example: "user-uuid-here",
  })
  @ApiOkResponse({
    description: "Данные пользователя успешно обновлены",
    schema: {
      example: {
        message: "Данные пользователя успешно обновлены",
        user: {
          id: "user-uuid",
          name: "Обновлённое Имя",
          username: "new_username",
          email: "updated@example.com",
          role: "TEACHER",
          createdAt: "2026-01-15T10:00:00.000Z",
          updatedAt: "2026-05-12T14:30:00.000Z",
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Не авторизован" })
  @ApiForbiddenResponse({ description: "Недостаточно прав" })
  @ApiNotFoundResponse({ description: "Пользователь не найден" })
  async update(
    @Authorized("role") role: Role,
    @Param("id") userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return await this.usersService.update(role, userId, dto);
  }
}
