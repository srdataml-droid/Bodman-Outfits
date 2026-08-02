import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminAuthGuard } from "./admin-auth.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AdminAuthGuard],
  exports: [AuthService, AdminAuthGuard],
})
export class AuthModule {}
