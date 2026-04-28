import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Authorization } from "src/auth/decorators/authorization.decorator";
import { Authorized } from "src/auth/decorators/authorized.decorator";
import { CreatePostDto } from "./dto/create-post.dto";
import { FindAllPostDto } from "./dto/findAll-post.dto";
import { PostsService } from "./posts.service";

@Authorization()
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(@Authorized("id") userId: string, @Body() dto: CreatePostDto) {
    return await this.postsService.create(userId, dto);
  }

  @Get()
  async findAll(@Query() dto: FindAllPostDto) {
    return await this.postsService.findAll(dto);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return await this.postsService.findOne(id);
  }
}
