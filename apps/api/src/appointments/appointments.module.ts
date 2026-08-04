import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
