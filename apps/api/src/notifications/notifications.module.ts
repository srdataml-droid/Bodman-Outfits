import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

/**
 * Exported so the three submission modules can inject the service. No
 * controller: nothing about notifications is reachable over HTTP.
 */
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
