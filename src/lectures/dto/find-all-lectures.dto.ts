import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class FindAllLecturesDto {
  @ApiPropertyOptional({
    description: "Смещение для пагинации (сколько записей пропустить)",
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({
    description: "Количество записей для получения",
    example: 10,
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  take?: number = 10;

  @ApiPropertyOptional({
    description: "Фильтр по ID пользователя (только его лекции)",
    example: "user-uuid-here",
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
