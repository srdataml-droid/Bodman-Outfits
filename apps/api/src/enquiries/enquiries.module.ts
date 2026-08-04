import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";
import { EnquiriesController } from "./enquiries.controller";
import { EnquiriesService } from "./enquiries.service";

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [EnquiriesController],
  providers: [EnquiriesService],
})
export class EnquiriesModule {}
