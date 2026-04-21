import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { Authorization } from "./decorators/authorization.decorator";
import { Authorized } from "./decorators/authorized.decorator";
import { LoginRequest } from "./dto/login.dto";
import { RegisterRequest } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Res({
      passthrough: true,
    })
    res: Response,
    @Body() dto: RegisterRequest,
  ) {
    return await this.authService.register(res, dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({
      passthrough: true,
    })
    res: Response,
    @Body() dto: LoginRequest,
  ) {
    return await this.authService.login(res, dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Res({
      passthrough: true,
    })
    res: Response,
    @Req() req: Request,
  ) {
    return await this.authService.refresh(req, res);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @Authorization()
  @Get("@me")
  async me(@Authorized("id") id: string) {
    return this.authService.me(id);
  }
}
