import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { FilesService } from "src/s3/file.service";

@Injectable()
export class UploadService {
  constructor(
    private readonly filesServise: FilesService,
    private readonly prismaService: PrismaService,
  ) {}

  // @ts-ignore
  async create(userId: string, file: Express.Multer.File) {
    // проверка наличия пользователя
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException("Пользователь не найден");

    const fileUrl = await this.filesServise.uploadToS3(userId, file);

    return await this.prismaService.file.create({
      data: {
        url: fileUrl,
        mimeType: file.mimetype,
        originalName: file.originalname,
        userId: userId,
      },
    });
  }
}
