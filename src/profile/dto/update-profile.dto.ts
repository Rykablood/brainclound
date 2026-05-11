import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { Role } from "src/generated/prisma/enums";

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: "Новое имя пользователя",
    example: "Алексей Иванов",
    minLength: 2,
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({
    description: "Новый username (латиница, цифры, _, -, .)",
    example: "alex_ivanov",
    minLength: 3,
    maxLength: 32,
    pattern: "^[A-Za-z0-9_.\\-]+$",
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9_.\-]+$/, {
    message: "Username может содержать только латинские буквы, цифры, _, -, .",
  })
  username?: string;

  @ApiPropertyOptional({
    description: "Роль пользователя (только для ADMIN/DEVELOPER)",
    example: "TEACHER",
    enum: Role,
    enumName: "Role",
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
