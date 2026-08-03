import { BadRequestException, Body, Controller, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AdminThrottle, PublicWriteThrottle } from "../common/throttle";
import { AdminAuthGuard, type AuthenticatedRequest } from "../auth/admin-auth.guard";
import { CustomRequestsService } from "./custom-requests.service";
import {
  createCustomRequestSchema,
  reviewCustomRequestSchema,
  type CustomRequestDto,
  type CustomRequestReceiptDto,
} from "./custom-requests.schema";

@Controller("api/custom-requests")
export class CustomRequestsController {
  constructor(private readonly service: CustomRequestsService) {}

  // PUBLIC — customers have no accounts. Same tight budget as the other
  // anonymous write endpoints.
  @PublicWriteThrottle()
  @Post()
  @HttpCode(201)
  async create(@Body() body: unknown): Promise<CustomRequestReceiptDto> {
    const parsed = createCustomRequestSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.create(parsed.data);
  }

  // ADMIN ONLY — contains customer contact details and their design brief.
  @AdminThrottle()
  @UseGuards(AdminAuthGuard)
  @Get()
  async list(): Promise<CustomRequestDto[]> {
    return this.service.list();
  }

  // ADMIN ONLY. Status and its decline reason are the only mutable fields:
  // the description is the customer's own words and an admin has no reason
  // to be able to rewrite it.
  @AdminThrottle()
  @UseGuards(AdminAuthGuard)
  @Patch(":id")
  async review(
    @Param("id") id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<CustomRequestDto> {
    const parsed = reviewCustomRequestSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.review(id, req.admin.id, parsed.data);
  }
}
