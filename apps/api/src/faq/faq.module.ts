import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { FaqController } from "./faq.controller";
import { FaqService } from "./faq.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FaqController],
  providers: [FaqService],
})
export class FaqModule {}
