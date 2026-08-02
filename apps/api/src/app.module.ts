import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppointmentsModule } from "./appointments/appointments.module";
import { AuthModule } from "./auth/auth.module";
import { EnquiriesModule } from "./enquiries/enquiries.module";
import { FaqModule } from "./faq/faq.module";
import { HealthController } from "./health.controller";
import { ShopSettingsModule } from "./shop-settings/shop-settings.module";

@Module({
  imports: [
    // Global default (100 req/60s per IP); AuthController's login route
    // overrides this with a tighter @Throttle per AGENTS.md.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    AuthModule,
    ShopSettingsModule,
    FaqModule,
    AppointmentsModule,
    EnquiriesModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
