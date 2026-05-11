import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "src/generated/prisma/enums";
import { PrismaService } from "src/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class ProfileService {
  constructor(private readonly prismaService: PrismaService) {}

  async getProfile(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException("Пользователь не найден");

    return user;
  }

  async getProfileFiles(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException("Пользователь не найден");

    const profileFiles = await this.prismaService.file.findMany({
      where: {
        userId: id,
      },
    });

    return profileFiles;
  }

  async getProfilePosts(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException("Пользователь не найден");

    const profilePosts = await this.prismaService.post.findMany({
      where: { userId: id },
      select: {
        id: true,
        title: true,
        text: true,
        userId: true,
        status: true,
        files: {
          select: {
            file: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                url: true,
              },
            },
          },
        },
        // Теги
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return profilePosts.map((post) => ({
      id: post.id,
      title: post.title,
      text: post.text,
      userId: post.userId,
      status: post.status,
      tags: post.tags.map((t) => t.tag.name),
      files: post.files,
    }));
  }
  async getProfileLectures(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException("Пользователь не найден");

    const profileLectures = await this.prismaService.lecture.findMany({
      where: { userId: id },
      select: {
        id: true,
        title: true,
        text: true,
        preview: true,
        userId: true,
        status: true,

        _count: {
          select: {
            files: true,
            posts: true,
          },
        },

        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return profileLectures.map((lecture) => ({
      id: lecture.id,
      title: lecture.title,
      text: lecture.text,
      preview: lecture.preview,
      userId: lecture.userId,
      status: lecture.status,
      tags: lecture.tags.map((t) => t.tag.name),
      filesCount: lecture._count.files,
      postsCount: lecture._count.posts,
    }));
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Пользователь не найден");

    // 🔐 Проверка прав на изменение роли
    if (dto.role) {
      const allowedTransitions: Record<Role, Role[]> = {
        USER: [],
        TEAСHER: [Role.USER],
        ADMIN: [Role.USER, Role.TEAСHER], // админ может понижать (но не повышать до ADMIN/DEV)
        DEVELOPER: [Role.USER, Role.TEAСHER, Role.ADMIN],
      };

      // Если текущая роль не разрешает переход на dto.role → ошибка
      if (!allowedTransitions[user.role]?.includes(dto.role)) {
        throw new ForbiddenException("Недостаточно прав для изменения роли");
      }

      // 🔒 Жёсткий запрет: никто не может установить ADMIN или DEVELOPER через этот эндпоинт
      // @ts-ignore
      if ([Role.ADMIN, Role.DEVELOPER].includes(dto.role)) {
        throw new ForbiddenException(
          "Нельзя установить роль администратора или разработчика",
        );
      }
    }

    // 🔍 Проверка username на уникальность (если меняется)
    if (dto.username && dto.username !== user.username) {
      const existing = await this.prismaService.user.findUnique({
        where: { username: dto.username },
      });
      if (existing) {
        throw new ConflictException("Username уже занят");
      }
    }

    // ✏️ Обновление
    const updated = await this.prismaService.user.update({
      where: { id },
      data: {
        name: dto.name,
        username: "@" + dto.username,
        role: dto.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }
}
