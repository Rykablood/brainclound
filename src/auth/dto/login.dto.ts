import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsJWT,
  IsNotEmpty,
  IsString,
  MaxLength,
} from "class-validator";

export class LoginRequest {
  @ApiProperty({
    description: "email пользователя",
    example: "darkusFoxis@mail.com",
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: "Пароль пользователя",
    example: "123456789",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}

export class LoginResponse {
  @ApiProperty({
    description: "Token",
    example:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMwNzA4ODQ2LWVjMjgtNDk4Ny05OTBmLWFjYTFiNmZiY2IwYSIsImlhdCI6MTc2ODEwNjUwMywiZXhwIjoxNzY4MTEzNzAzfQ.cTvedtj7giihTMcoH3ikH8NhmMXdaallpgXBCp9aPa0",
  })
  @IsString()
  @IsNotEmpty()
  @IsJWT()
  accessToken!: string;
}
