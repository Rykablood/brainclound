import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { CreateLectureDto } from "./dto/create-lecture.dto";
import { FindAllLecturesDto } from "./dto/find-all-lectures.dto";
import { FindLectureByContentDto } from "./dto/findByContent-lectures.dto";
import { GetLatestLecturesDto } from "./dto/get-latest-lectures.dto";

@Injectable()
export class LecturesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateLectureDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Пользователь не найден");

    if (dto.fileIds?.length) {
      const ownedFiles = await this.prisma.file.findMany({
        where: {
          id: { in: dto.fileIds },
          userId,
        },
        select: { id: true },
      });
      const ownedFileIds = ownedFiles.map((f) => f.id);
      const invalidIds = dto.fileIds.filter((id) => !ownedFileIds.includes(id));

      if (invalidIds.length > 0) {
        throw new BadRequestException(
          `Файлы не найдены или не принадлежат вам: ${invalidIds.join(", ")}`,
        );
      }
    }

    if (dto.postIds?.length) {
      const approvedPosts = await this.prisma.post.findMany({
        where: {
          id: { in: dto.postIds },
          status: "APPROVED",
        },
        select: { id: true },
      });
      const approvedIds = approvedPosts.map((p) => p.id);
      const invalidIds = dto.postIds.filter((id) => !approvedIds.includes(id));

      if (invalidIds.length > 0) {
        throw new BadRequestException(
          `Посты не найдены или не одобрены: ${invalidIds.join(", ")}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Создаём лекцию
      const lecture = await tx.lecture.create({
        data: {
          title: dto.title,
          text: dto.text,
          preview: dto.preview,
          userId,
        },
      });

      // 2. Привязываем файлы (если есть)
      if (dto.fileIds?.length) {
        const lectureFiles = dto.fileIds.map((fileId, index) => ({
          lectureId: lecture.id,
          fileId,
          sortOrder: index,
        }));
        await tx.lectureFile.createMany({ data: lectureFiles });
      }

      // 3. Привязываем посты (если есть)
      if (dto.postIds?.length) {
        const lecturePosts = dto.postIds.map((postId, index) => ({
          lectureId: lecture.id,
          postId,
          sortOrder: index,
        }));
        await tx.lecturePost.createMany({ data: lecturePosts });
      }

      if (dto.tags?.length) {
        const uniqueTags = [
          ...new Set(dto.tags.map((t) => t.trim().toLowerCase())),
        ];
        const tags = await this.upsertTags(tx, uniqueTags); // ✅ tx теперь совместим

        const lectureTags = tags.map((tag) => ({
          lectureId: lecture.id,
          tagId: tag.id,
        }));
        await tx.lectureTag.createMany({ data: lectureTags });
      }
      // 4. Возвращаем лекцию с полными данными
      return tx.lecture.findUnique({
        where: { id: lecture.id },
        include: {
          user: {
            select: { id: true, name: true, username: true },
          },
          files: {
            orderBy: { sortOrder: "asc" },
            include: {
              file: {
                select: {
                  id: true,
                  url: true,
                  mimeType: true,
                  originalName: true,
                },
              },
            },
          },
          posts: {
            orderBy: { sortOrder: "asc" },
            include: {
              post: {
                select: {
                  id: true,
                  title: true,
                  text: true,
                  status: true,
                  user: {
                    select: { id: true, name: true, username: true },
                  },
                },
              },
            },
          },
        },
      });
    });
  }

  async findAll(dto: FindAllLecturesDto) {
    const skip = dto.skip ?? 0;
    const take = Math.min(dto.take ?? 10, 100);

    const lectures = await this.prisma.lecture.findMany({
      where: {
        userId: dto.userId ? dto.userId : undefined,
        status: "APPROVED",
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        preview: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, username: true },
        },
        _count: {
          select: { posts: true, files: true },
        },
        files: {
          orderBy: { sortOrder: "asc" },
          include: {
            file: {
              select: {
                id: true,
                url: true,
                mimeType: true,
                originalName: true,
              },
            },
          },
        },
        tags: {
          select: {
            tag: {
              select: { name: true },
            },
          },
        },
      },
    });

    return lectures.map((lecture) => ({
      ...lecture,
      tags: lecture.tags.map((t) => t.tag.name),
    }));
  }

  async findOne(id: string) {
    const lecture = await this.prisma.lecture.findUnique({
      where: { id, status: "APPROVED" },
      select: {
        id: true,
        title: true,
        text: true,
        preview: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { id: true, name: true, username: true },
        },
        files: {
          orderBy: { sortOrder: "asc" },
          include: {
            file: {
              select: {
                id: true,
                url: true,
                mimeType: true,
                originalName: true,
              },
            },
          },
        },
        posts: {
          orderBy: { sortOrder: "asc" },
          include: {
            post: {
              select: {
                id: true,
                title: true,
                text: true,
                status: true,
                user: {
                  select: { id: true, name: true, username: true },
                },
              },
            },
          },
        },
        // 🔥 Добавляем выборку тегов
        tags: {
          select: {
            tag: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!lecture) throw new NotFoundException(`Лекция ${id} не найдена`);

    return {
      ...lecture,
      tags: lecture.tags.map((t) => t.tag.name),
    };
  }
  async remove(userId: string, lectureId: string) {
    const lecture = await this.prisma.lecture.findUnique({
      where: { id: lectureId },
      select: { userId: true },
    });

    if (!lecture) {
      throw new NotFoundException("Пост не найден");
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      throw new NotFoundException("Пользователь не найден");
    }

    const isAuthor = lecture.userId === userId;
    const isAdmin = currentUser.role === "ADMIN";
    const isDeveloper = currentUser.role === "DEVELOPER";

    if (!isAuthor && !isAdmin && !isDeveloper) {
      throw new ForbiddenException("Недостаточно прав для удаления поста");
    }

    await this.prisma.lecture.delete({
      where: { id: lectureId },
    });

    // Возвращаем void — контроллер отправит 204 No Content
  }

  async getLastLectures() {
    const lectures = await this.prisma.lecture.findMany({
      where: {
        status: "APPROVED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,

      select: {
        id: true,
        title: true,
        preview: true,
        user: {
          select: {
            name: true,
            username: true,
          },
        },

        _count: {
          select: { files: true, posts: true },
        },

        tags: {
          select: {
            tag: {
              select: { name: true },
            },
          },
        },
      },
    });

    return lectures.map((lecture) => ({
      id: lecture.id,
      title: lecture.title,
      preview: lecture.preview,
      author: {
        name: lecture.user.name,
        username: lecture.user.username,
      },
      filesCount: lecture._count.files,
      postsCount: lecture._count.posts,
      tags: lecture.tags.map((t) => t.tag.name),
    }));
  }

  async findByContent(dto: FindLectureByContentDto) {
    const { content } = dto;

    const where: any = {
      status: "APPROVED",
    };

    if (content?.trim()) {
      const search = content.trim();

      where.OR = [
        // Поиск по заголовку
        { title: { contains: search } },
        // Поиск по тексту поста
        { text: { contains: search } },
        // Поиск по тегам (хотя бы один тег совпадает)
        {
          tags: {
            some: { tag: { name: { contains: search } } },
          },
        },
        // Поиск по имени автора
        { user: { name: { contains: search } } },
        { user: { username: { contains: search } } },
      ];
    }

    const lectures = await this.prisma.lecture.findMany({
      where,
      take: 20,
      select: {
        id: true,
        title: true,
        preview: true,
        user: {
          select: {
            name: true,
            username: true,
          },
        },

        _count: {
          select: { files: true, posts: true },
        },

        tags: {
          select: {
            tag: {
              select: { name: true },
            },
          },
        },
      },
    });

    return lectures.map((lecture) => ({
      id: lecture.id,
      preview: lecture.preview,
      authorName: lecture.user.name,
      authorUsername: lecture.user.username,
      filesCount: lecture._count.files,
      postsCount: lecture._count.posts,
      title: lecture.title,
      tags: lecture.tags.map((t) => t.tag.name),
    }));
  }

  async getLatest(dto: GetLatestLecturesDto) {
    const { skip = 0, take = 25 } = dto;

    const lectures = await this.prisma.lecture.findMany({
      where: {
        status: "APPROVED", // Только одобренные
      },
      orderBy: {
        createdAt: "desc", // Сначала новые
      },
      skip,
      take,
      select: {
        id: true,
        title: true,
        preview: true,
        user: {
          select: { name: true, username: true },
        },
        _count: {
          select: { files: true, posts: true },
        },
        tags: {
          select: {
            tag: { select: { name: true } },
          },
        },
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
    }));
  }

  private async upsertTags(tx: any, tagNames: string[]) {
    const tags = await Promise.all(
      tagNames.map((name) =>
        tx.tag.upsert({
          where: { name },
          create: { name },
          update: {},
          select: { id: true, name: true },
        }),
      ),
    );
    return tags;
  }
}
