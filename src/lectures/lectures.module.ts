import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { LecturesController } from "./lectures.controller";
import { LecturesService } from "./lectures.service";

@Module({
  controllers: [LecturesController],
  providers: [LecturesService, PrismaService],
})
export class LecturesModule {}
