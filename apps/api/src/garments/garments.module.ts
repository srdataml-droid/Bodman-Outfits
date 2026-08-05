import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { GarmentsController } from "./garments.controller";
import { GarmentsService } from "./garments.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [GarmentsController],
  providers: [GarmentsService],
})
export class GarmentsModule {}
