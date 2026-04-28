import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateLectureDto {
  @IsString()
  @MinLength(3, { message: "Заголовок должен содержать минимум 3 символа" })
  title!: string;

  @IsString()
  @MinLength(10, { message: "Текст лекции слишком короткий" })
  text!: string;

  @IsUrl({}, { message: "preview должен быть валидным URL" })
  preview!: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  fileIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  postIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: "Каждый тег должен быть строкой" })
  @MaxLength(30, { each: true, message: "Тег не должен превышать 30 символов" })
  tags?: string[];
}
