import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.ALLOWED_DOMAINS?.split(","),
    allowedHeaders:
      "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe",
    credentials: true,
  });
  app.use(cookieParser());
  await app.listen(8000);
}
bootstrap();
