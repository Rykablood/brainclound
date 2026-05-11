import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateLectureDto {
  @ApiProperty({
    description: "Заголовок лекции",
    example: "Введение в NestJS",
    minLength: 3,
  })
  @IsString()
  @MinLength(3, { message: "Заголовок должен содержать минимум 3 символа" })
  title!: string;

  @ApiProperty({
    description: "Текст лекции (поддерживает HTML из RichTextEditor)",
    example: "<p>Полный курс по созданию API...</p>",
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: "Текст лекции слишком короткий" })
  text!: string;

  @ApiProperty({
    description: "URL обложки лекции (превью)",
    example: "https://example.com/preview.jpg",
  })
  @IsUrl({}, { message: "preview должен быть валидным URL" })
  preview!: string;

  @ApiPropertyOptional({
    description: "Массив ID загруженных файлов",
    example: ["file-id-1", "file-id-2"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];

  @ApiPropertyOptional({
    description: "Массив ID связанных постов",
    example: ["post-id-1", "post-id-2"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  postIds?: string[];

  @ApiPropertyOptional({
    description: "Массив тегов для лекции",
    example: ["nestjs", "backend", "tutorial"],
    type: [String],
    maxLength: 30,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: "Каждый тег должен быть строкой" })
  @MaxLength(30, { each: true, message: "Тег не должен превышать 30 символов" })
  tags?: string[];
}
