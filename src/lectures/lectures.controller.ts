import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Authorization } from "src/auth/decorators/authorization.decorator";
import { Authorized } from "src/auth/decorators/authorized.decorator";
import { CreateLectureDto } from "./dto/create-lecture.dto";
import { FindAllLecturesDto } from "./dto/find-all-lectures.dto";
import { LecturesService } from "./lectures.service";

@Authorization()
@Controller("lectures")
export class LecturesController {
  constructor(private readonly lecturesService: LecturesService) {}

  @Post()
  async create(
    @Authorized("id") userId: string,
    @Body() dto: CreateLectureDto,
  ) {
    return this.lecturesService.create(userId, dto);
  }

  @Get()
  async findAll(@Query() dto: FindAllLecturesDto) {
    return this.lecturesService.findAll(dto);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.lecturesService.findOne(id);
  }
}
