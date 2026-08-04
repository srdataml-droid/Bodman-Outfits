import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { CustomRequestsController } from "./custom-requests.controller";
import { CustomRequestsService } from "./custom-requests.service";

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [CustomRequestsController],
  providers: [CustomRequestsService],
})
export class CustomRequestsModule {}
