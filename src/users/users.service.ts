import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { Role } from "src/generated/prisma/enums";
import { PrismaService } from "src/prisma.service";
import { GetUserDto } from "src/profile/dto/get-user.dto";
import generateUsername from "src/utils/generate-username.util";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  // 🔹 Проверка: может ли текущая роль назначить целевую роль
  private canAssignRole(requesterRole: Role, targetRole: Role): boolean {
    // DEVELOPER может назначать любую роль
    if (requesterRole === Role.DEVELOPER) return true;

    // ADMIN может назначать только USER или TEACHER (не может создать другого ADMIN/DEVELOPER)
    if (requesterRole === Role.ADMIN) {
      return targetRole === Role.USER || targetRole === Role.TEAСHER;
    }

    return false;
  }

  // 🔹 Общая проверка: только ADMIN или DEVELOPER
  private checkAdminRole(role: Role) {
    if (role !== Role.ADMIN && role !== Role.DEVELOPER) {
      throw new ForbiddenException(
        "Недостаточно прав для выполнения этого действия",
      );
    }
  }

  // 🔹 Получить данные пользователя + счётчики
  async findOne(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { posts: true, lectures: true } },
      },
    });

    if (!user) throw new NotFoundException("Пользователь не найден");

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      postsCount: user._count.posts,
      lecturesCount: user._count.lectures,
    };
  }

  // 🔹 Получить лекции пользователя с пагинацией
  async getUserLectures(userId: string, dto: GetUserDto) {
    const { skip = 0, take = 25 } = dto;

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) throw new NotFoundException("Пользователь не найден");

    const lectures = await this.prismaService.lecture.findMany({
      where: { userId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        title: true,
        preview: true,
        createdAt: true,
        user: { select: { name: true, username: true } },
        _count: { select: { files: true, posts: true } },
        tags: { select: { tag: { select: { name: true } } } },
      },
    });

    return lectures.map((lec) => ({
      id: lec.id,
      title: lec.title,
      preview: lec.preview,
      authorName: lec.user.name,
      authorUsername: lec.user.username,
      filesCount: lec._count.files,
      postsCount: lec._count.posts,
      tags: lec.tags.map((t) => t.tag.name),
      createdAt: lec.createdAt,
    }));
  }

  async search(requesterRole: Role, content: string, dto: GetUserDto) {
    const { skip = 0, take = 20 } = dto;

    // Если запрос пустой — возвращаем пустой результат
    if (!content || content.trim().length < 2) {
      return { users: [], total: 0 };
    }

    const searchQuery = content.trim();

    const selectFields: any = {
      id: true,
      name: true,
      username: true,
      role: true,
      createdAt: true,
      _count: {
        select: { posts: true, lectures: true },
      },
    };

    // 🔹 2. Фильтр поиска (без mode: "insensitive" для совместимости)
    const where = {
      OR: [
        { name: { contains: searchQuery } },
        { username: { contains: searchQuery } },
      ],
    };

    try {
      // 🔹 3. Параллельные запросы
      const [users, total] = await Promise.all([
        this.prismaService.user.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          select: selectFields,
        }),
        this.prismaService.user.count({ where }),
      ]);

      // 🔹 4. Форматируем ответ
      return {
        users: users.map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email, // Будет undefined, если не админ
          role: u.role,
          createdAt: u.createdAt,
          postsCount: u._count.posts,
          lecturesCount: u._count.lectures,
        })),
        total,
      };
    } catch (error) {
      console.error("Search error:", error);
      throw error; // Пробрасываем ошибку дальше, чтобы фронт увидел её
    }
  }

  // 🔹 Получить посты пользователя с пагинацией
  async getUserPosts(userId: string, dto: GetUserDto) {
    const { skip = 0, take = 25 } = dto;

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) throw new NotFoundException("Пользователь не найден");

    const posts = await this.prismaService.post.findMany({
      where: { userId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        title: true,
        createdAt: true,
        user: { select: { name: true, username: true } },
        _count: { select: { files: true } },
        tags: { select: { tag: { select: { name: true } } } },
      },
    });

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      authorName: post.user.name,
      authorUsername: post.user.username,
      filesCount: post._count.files,
      tags: post.tags.map((t) => t.tag.name),
      createdAt: post.createdAt,
    }));
  }

  // 🔹 Удалить пользователя (только ADMIN/DEVELOPER)
  async remove(role: Role, userId: string) {
    this.checkAdminRole(role);

    const targetUser = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) throw new NotFoundException("Пользователь не найден");

    // Нельзя удалить самого себя
    if (role === targetUser.role && role === Role.DEVELOPER) {
      // DEVELOPER может удалить другого DEVELOPER, но не себя
    }

    await this.prismaService.user.delete({ where: { id: userId } });

    return { message: "Пользователь успешно удалён", id: userId };
  }

  // 🔹 Создать пользователя (только ADMIN/DEVELOPER)
  async create(requesterRole: Role, dto: CreateUserDto) {
    this.checkAdminRole(requesterRole);

    const {
      name,
      email,
      password,
      username: customUsername,
      role: requestedRole,
    } = dto;

    // 🔹 Валидация роли: может ли запросивший назначить эту роль?
    const finalRole = requestedRole || Role.USER; // По умолчанию — USER
    if (requestedRole && !this.canAssignRole(requesterRole, requestedRole)) {
      throw new ForbiddenException(
        `Недостаточно прав для назначения роли ${requestedRole}`,
      );
    }

    // Проверка email
    const existUser = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (existUser)
      throw new ConflictException("Пользователь с таким email уже существует");

    // Генерация username
    let username: string;
    if (customUsername) {
      const existByUsername = await this.prismaService.user.findUnique({
        where: { username: customUsername },
      });
      if (existByUsername)
        throw new ConflictException("Такой username уже занят");
      username = customUsername;
    } else {
      let existingUserByUsername;
      do {
        username = generateUsername();
        existingUserByUsername = await this.prismaService.user.findUnique({
          where: { username },
        });
      } while (existingUserByUsername);
    }

    // Создание
    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        password: await argon2.hash(password),
        username,
        role: finalRole,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      message: "Пользователь успешно создан",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  // 🔹 Обновить пользователя (только ADMIN/DEVELOPER)
  async update(requesterRole: Role, userId: string, dto: UpdateUserDto) {
    this.checkAdminRole(requesterRole);

    const {
      name,
      email,
      password,
      username: customUsername,
      role: requestedRole,
    } = dto;

    const targetUser = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) throw new NotFoundException("Пользователь не найден");

    // 🔹 Валидация смены роли
    if (requestedRole && requestedRole !== targetUser.role) {
      if (!this.canAssignRole(requesterRole, requestedRole)) {
        throw new ForbiddenException(
          `Недостаточно прав для изменения роли на ${requestedRole}`,
        );
      }
      // 🔹 Защита: нельзя понизить роль разработчика, если запросивший не разработчик
      if (
        targetUser.role === Role.DEVELOPER &&
        requesterRole !== Role.DEVELOPER
      ) {
        throw new ForbiddenException(
          "Только разработчик может изменить роль другого разработчика",
        );
      }
    }

    // Проверка уникальности email
    if (email && email !== targetUser.email) {
      const existEmail = await this.prismaService.user.findFirst({
        where: { email, id: { not: userId } },
      });
      if (existEmail)
        throw new ConflictException(
          "Пользователь с таким email уже существует",
        );
    }

    // Проверка уникальности username
    if (customUsername && customUsername !== targetUser.username) {
      const existUsername = await this.prismaService.user.findFirst({
        where: { username: customUsername, id: { not: userId } },
      });
      if (existUsername)
        throw new ConflictException("Такой username уже занят");
    }

    // Подготовка данных
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (customUsername) updateData.username = customUsername;
    if (password) updateData.password = await argon2.hash(password);
    if (requestedRole) updateData.role = requestedRole;

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: "Данные пользователя успешно обновлены",
      user: updatedUser,
    };
  }
}
