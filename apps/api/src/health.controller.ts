import { Controller, Get } from "@nestjs/common";

@Controller("api/health")
export class HealthController {
  @Get()
  getHealth(): { status: "ok" } {
    return { status: "ok" };
  }
}
