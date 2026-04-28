import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Удаляет поля, которых нет в DTO
      transform: true, // превращает строки в числа/булевы значения
      transformOptions: {
        enableImplicitConversion: true, // Дополнительная страховка
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
