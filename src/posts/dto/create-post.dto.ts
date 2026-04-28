import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: "Заголовок не должен превышать 200 символов" })
  title!: string;

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: "Массив файлов не должен быть пустым" })
  @IsUUID("4", {
    each: true,
    message: "Каждый fileId должен быть валидным UUID",
  })
  fileIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: "Каждый тег должен быть строкой" })
  @MaxLength(30, { each: true, message: "Тег не должен превышать 30 символов" })
  tags?: string[];
}
