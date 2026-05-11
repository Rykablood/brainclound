import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Role } from "src/generated/prisma/enums";

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "Новое имя пользователя",
    example: "Алексей Петров",
    minLength: 2,
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({
    description: "Новый email пользователя",
    example: "new@example.com",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: "Новый пароль (если нужно сменить)",
    example: "newSecurePassword456",
    minLength: 8,
    maxLength: 128,
    writeOnly: true,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({
    description: "Новый username",
    example: "alex_petrov",
    minLength: 2,
    maxLength: 32,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username?: string;

  @ApiPropertyOptional({
    description: "Новая роль (только для ADMIN/DEVELOPER)",
    example: "ADMIN",
    enum: Role,
    enumName: "Role",
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
