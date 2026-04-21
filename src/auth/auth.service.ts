import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import type { Request, Response } from "express";
import { User } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma.service";
import generateUsername from "src/utils/generate-username.util";
import { isDev } from "src/utils/is-dev.utils";
import { parseTimeToMs } from "src/utils/parser-time.util";
import { LoginRequest } from "./dto/login.dto";
import { RegisterRequest } from "./dto/register.dto";
import type { JwtPayload } from "./interfaces/jwt.interface";
@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_TOKEN_TTL: string;
  private readonly JWT_REFRESH_TOKEN_TTL: string;

  private readonly COOKIE_DOMAIN: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_ACCESS_TOKEN_TTL = configService.getOrThrow<string>(
      "JWT_ACCESS_TOKEN_TTL",
    );

    this.JWT_REFRESH_TOKEN_TTL = configService.getOrThrow<string>(
      "JWT_REFRESH_TOKEN_TTL",
    );

    this.COOKIE_DOMAIN = configService.getOrThrow<string>("COOKIE_DOMAIN");
  }

  // Регистрация
  async register(res: Response, dto: RegisterRequest) {
    const { name, email, password } = dto;

    // Проверка наличия пользователя в БД
    const existUser = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    // Еслит пользователь существует, то ошибка
    if (existUser)
      throw new ConflictException("Данный пользователь уже существует");

    // Генерация username
    let username: string;
    let existingUserByUsername: User | null;

    do {
      username = generateUsername();
      // Если такой usernmae занят, то произвести перегенерацию
      existingUserByUsername = await this.prismaService.user.findUnique({
        where: { username },
      });
    } while (existingUserByUsername);

    // Сохранение пользвоателя
    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        // Хэширование пароля
        password: await argon2.hash(password),
        username,
      },
    });

    return this.auth(res, user.id, user.role);
  }

  // Логин
  async login(res: Response, dto: LoginRequest) {
    const { email, password } = dto;

    // Получение пользователя из БД
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    // Если пользователя нету, то вернуть ошибку 404
    if (!user) throw new NotFoundException("Пользователь не найден");

    // Если пользователь есть, то проверить пароль полльзователя
    const isVerifyPassword = await argon2.verify(user.password, password);

    // Если пароль не совпали, то выдать 404 (в целях безопасности)
    if (!isVerifyPassword)
      throw new NotFoundException("Пользователь не найден");

    // Если всё хорошо, то вернуть JWT
    return this.auth(res, user.id, user.role);
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies["refreshToken"];

    if (!refreshToken)
      throw new UnauthorizedException("Недействительный refresh-токен");

    const payload: JwtPayload = await this.jwtService.verifyAsync(refreshToken);

    if (payload) {
      const user = await this.prismaService.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          role: true,
        },
      });

      if (!user) throw new NotFoundException("Пользователь не найден");

      return this.auth(res, user.id, user.role);
    }
  }

  private auth(res: Response, id: string, role: string) {
    const { accessToken, refreshToken } = this.generateTokens(id, role);

    this.setCookie(
      res,
      refreshToken,
      new Date(Date.now() + parseTimeToMs(this.JWT_REFRESH_TOKEN_TTL)),
    );

    return { accessToken };
  }

  async logout(res: Response) {
    this.setCookie(res, "refreshToken", new Date(0));
    return true;
  }

  // Сохранение данных в куки
  private setCookie(res: Response, value: string, expires: Date) {
    res.cookie("refreshToken", value, {
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      expires,
      secure: !isDev(this.configService),
      sameSite: isDev(this.configService) ? "none" : "lax",
    });
  }

  // Генерация токенов
  private generateTokens(id: string, role: string) {
    const payload: JwtPayload = { id, role };

    // @ts-ignore
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_ACCESS_TOKEN_TTL,
    });

    // @ts-ignore
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_REFRESH_TOKEN_TTL,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
