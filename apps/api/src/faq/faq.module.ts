import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { FaqController } from "./faq.controller";
import { FaqService } from "./faq.service";

@Module({
  imports: [PrismaModule],
  controllers: [FaqController],
  providers: [FaqService],
})
export class FaqModule {}
