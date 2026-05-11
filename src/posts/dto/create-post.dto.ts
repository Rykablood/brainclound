import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreatePostDto {
  @ApiProperty({
    description: "Заголовок поста",
    example: "Мой первый пост",
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: "Заголовок не должен превышать 200 символов" })
  title!: string;

  @ApiProperty({
    description: "Текст поста (поддерживает HTML из RichTextEditor)",
    example: "<p>Текст поста с <strong>форматированием</strong>...</p>",
  })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiPropertyOptional({
    description: "Массив ID загруженных файлов",
    example: ["file-uuid-1", "file-uuid-2"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", {
    each: true,
    message: "Каждый fileId должен быть валидным UUID",
  })
  fileIds?: string[];

  @ApiPropertyOptional({
    description: "Массив тегов для поста",
    example: ["личное", "новости", "обзор"],
    type: [String],
    maxLength: 30,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: "Каждый тег должен быть строкой" })
  @MaxLength(30, { each: true, message: "Тег не должен превышать 30 символов" })
  tags?: string[];
}
