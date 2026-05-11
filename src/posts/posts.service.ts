import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { FindAllPostDto } from "./dto/findAll-post.dto";
import { FindPostByContentDto } from "./dto/findByContent-post.dto";

@Injectable()
export class PostsService {
  constructor(private prismaService: PrismaService) {}

  async create(userId: string, dto: CreatePostDto) {
    // проверка что пользователь существует
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException("Пользователь не найден");
    return await this.prismaService.$transaction(async (tx) => {
      // Создание поста
      const post = await tx.post.create({
        data: {
          title: dto.title,
          text: dto.text,
          userId: userId,
          status: "PREVIEW",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

      // Проверка, есть ли файлы
      if (dto.fileIds?.length) {
        // Проверяем, что файлы существуют и принадлежат этому пользователю
        const ownedFiles = await tx.file.findMany({
          where: {
            id: { in: dto.fileIds },
            userId,
          },
          select: { id: true },
        });
        const ownedFileIds = ownedFiles.map((f) => f.id);
        const missingIds = dto.fileIds.filter(
          (id) => !ownedFileIds.includes(id),
        );

        // Если какие-то файлы не найдены или не принадлежат пользователю
        if (missingIds.length > 0) {
          throw new BadRequestException(
            `Файлы не найдены или не принадлежат вам: ${missingIds.join(", ")}`,
          );
        }

        // Создаём связи в PostFile с порядком (sortOrder)
        const postFilesData = ownedFileIds.map((fileId, index) => ({
          postId: post.id,
          fileId,
          sortOrder: index, // Порядок как в массиве от клиента
        }));

        await tx.postFile.createMany({
          data: postFilesData,
        });
      }

      if (dto.tags?.length) {
        const uniqueTags = [
          ...new Set(dto.tags.map((t) => t.trim().toLowerCase())),
        ];
        const tags = await this.upsertTags(tx, uniqueTags);

        const postTags = tags.map((tag) => ({
          postId: post.id,
          tagId: tag.id,
        }));
        await tx.postTag.createMany({ data: postTags });
      }

      // Возвращаем пост
      return tx.post.findUnique({
        where: { id: post.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          files: {
            // Через junction-таблицу получаем файлы
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
            orderBy: { sortOrder: "asc" }, // Сортируем по порядку добавления
          },
        },
      });
    });
  }

  async findAll(dto: FindAllPostDto) {
    const skip = dto.skip ?? 0;
    const take = Math.min(dto.take ?? 10, 100);

    if (dto.userId) {
      const user = await this.prismaService.user.findUnique({
        where: { id: dto.userId },
      });
      if (!user) {
        throw new NotFoundException(`Пользователь ${dto.userId} не найден`);
      }
    }

    // 1. Получаем данные из БД
    const posts = await this.prismaService.post.findMany({
      where: {
        userId: dto.userId ? dto.userId : undefined,
        status: "APPROVED",
      },
      skip,
      take,
      select: {
        id: true,
        title: true,
        text: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        files: {
          select: {
            file: {
              select: {
                originalName: true,
                mimeType: true,
                url: true,
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

    // 2. Преобразуем теги в простой массив строк ["tag1", "tag2"]
    return posts.map((post) => ({
      ...post,
      tags: post.tags.map((t) => t.tag.name),
    }));
  }

  async findOne(id: string) {
    const post = await this.prismaService.post.findUnique({
      where: { id, status: "APPROVED" },
      select: {
        id: true,
        title: true,
        text: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        files: {
          select: {
            file: {
              select: {
                originalName: true,
                mimeType: true,
                url: true,
              },
            },
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
    });

    if (!post) throw new NotFoundException(`Пост ${id} не найден`);

    return {
      ...post,
      tags: post.tags.map((t) => t.tag.name),
    };
  }

  async findByContent(dto: FindPostByContentDto) {
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

    const posts = await this.prismaService.post.findMany({
      where,
      take: 20,
      select: {
        id: true,
        title: true,

        user: {
          select: {
            name: true,
            username: true,
          },
        },

        _count: {
          select: { files: true },
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

    return posts.map((post) => ({
      id: post.id,
      authorName: post.user.name,
      authorUsername: post.user.username,
      filesCount: post._count.files,
      title: post.title,
      tags: post.tags.map((t) => t.tag.name),
    }));
  }

  async remove(userId: string, postId: string) {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (!post) {
      throw new NotFoundException("Пост не найден");
    }

    const currentUser = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      throw new NotFoundException("Пользователь не найден");
    }

    const isAuthor = post.userId === userId;
    const isAdmin = currentUser.role === "ADMIN";
    const isDeveloper = currentUser.role === "DEVELOPER";

    if (!isAuthor && !isAdmin && !isDeveloper) {
      throw new ForbiddenException("Недостаточно прав для удаления поста");
    }

    await this.prismaService.post.delete({
      where: { id: postId },
    });
  }

  async getLastPosts() {
    const posts = await this.prismaService.post.findMany({
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

        user: {
          select: {
            name: true,
            username: true,
          },
        },

        _count: {
          select: { files: true },
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

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      author: {
        name: post.user.name,
        username: post.user.username,
      },
      filesCount: post._count.files,
      tags: post.tags.map((t) => t.tag.name),
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
