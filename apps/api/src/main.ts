import "reflect-metadata";
import * as path from "path";
import { config as loadEnv } from "dotenv";
import cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// Load the repo-root .env before Nest instantiates anything that reads
// process.env (PrismaService reads DATABASE_URL in its constructor).
// Resolved from this file's location, not the current working directory:
// `pnpm --filter @atelier-haute/api run dev` executes with cwd = apps/api,
// which has no .env of its own. Without this the pg adapter silently falls
// back to libpq defaults and every database-backed route fails with a
// misleading "DatabaseAccessDenied" auth error.
// dotenv does not overwrite variables already present in the environment,
// so real deployment env vars still take precedence over this file.
loadEnv({ path: path.resolve(__dirname, "../../../.env") });

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });
  // Required for AdminAuthGuard: reads the session token from req.cookies.
  app.use(cookieParser());
  await app.listen(Number(process.env.PORT ?? 4000));
}

void bootstrap();
