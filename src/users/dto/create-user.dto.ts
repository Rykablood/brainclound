import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Role } from "src/generated/prisma/enums";

export class CreateUserDto {
  @ApiProperty({
    description: "Имя пользователя",
    example: "Алексей Иванов",
    minLength: 2,
    maxLength: 64,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name!: string;

  @ApiProperty({
    description: "Email пользователя (уникальный)",
    example: "alex@example.com",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: "Пароль пользователя (мин. 8 символов)",
    example: "securePassword123",
    minLength: 8,
    maxLength: 128,
    writeOnly: true,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({
    description: "Username (уникальный, латиница)",
    example: "alex_ivanov",
    minLength: 2,
    maxLength: 32,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
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
