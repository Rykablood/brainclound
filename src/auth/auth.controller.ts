import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginRequest } from "./dto/login.dto";
import { RegisterRequest } from "./dto/register.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Регистрация нового пользователя" })
  @ApiResponse({
    status: 201,
    description:
      "Пользователь успешно зарегистрирован. Access и Refresh токены установлены в httpOnly куки.",
  })
  @ApiResponse({
    status: 400,
    description: "Невалидные данные запроса (проверьте DTO)",
  })
  @ApiResponse({ status: 409, description: "Email или username уже заняты" })
  @ApiBody({ type: RegisterRequest })
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RegisterRequest,
  ) {
    return await this.authService.register(res, dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Авторизация пользователя" })
  @ApiResponse({
    status: 200,
    description: "Успешный вход. Токены обновлены в httpOnly куки.",
  })
  @ApiResponse({ status: 400, description: "Невалидные данные запроса" })
  @ApiResponse({ status: 401, description: "Неверный email или пароль" })
  @ApiBody({ type: LoginRequest })
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginRequest,
  ) {
    return await this.authService.login(res, dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Обновление токенов" })
  @ApiResponse({
    status: 200,
    description: "Токены успешно обновлены. Новые значения установлены в куки.",
  })
  @ApiResponse({
    status: 401,
    description: "Refresh токен отсутствует, истёк или невалиден",
  })
  async refresh(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return await this.authService.refresh(req, res);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Выход из аккаунта" })
  @ApiResponse({
    status: 200,
    description: "Сессия завершена. Refresh токен аннулирован, куки очищены.",
  })
  @ApiResponse({ status: 401, description: "Неавторизованный запрос" })
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }
}
