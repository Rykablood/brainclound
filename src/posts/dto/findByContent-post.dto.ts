import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class FindPostByContentDto {
  @ApiPropertyOptional({
    description: "Строка для поиска по заголовку, тексту или тегам",
    example: "nestjs",
    maxLength: 256,
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  content?: string;
}
