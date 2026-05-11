import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // конкретный источник
    credentials: true, // разрешить отправку кук и заголовков авторизации
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // явно разрешить заголовки
  });

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

  const config = new DocumentBuilder()
    .setTitle("Braincloud API - Дипломная работа")
    .setDescription("Документация к API сервера  Braincloud")
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("/docs", app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
