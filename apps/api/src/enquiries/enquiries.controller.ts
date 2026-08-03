import { BadRequestException, Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AdminThrottle, PublicWriteThrottle } from "../common/throttle";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { EnquiriesService } from "./enquiries.service";
import { type EnquiryDto, type EnquiryReceiptDto, createEnquirySchema, updateEnquiryStatusSchema } from "./enquiries.schema";

@Controller("api/enquiries")
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  // PUBLIC — customers have no accounts. Rate-limited to 5 per minute per IP,
  // matching appointments and login. Same deliberate looseness for the same
  // reason: carrier-level NAT means an aggressive per-IP limit blocks real
  // customers without stopping an attacker who can rotate addresses.
  @PublicWriteThrottle()
  @Post()
  @HttpCode(201)
  async createEnquiry(@Body() body: unknown): Promise<EnquiryReceiptDto> {
    const parsed = createEnquirySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.enquiriesService.createEnquiry(parsed.data);
  }

  // ADMIN ONLY — enquiries contain customer names, email addresses, phone
  // numbers and free-text messages. Must never ship unguarded.
  @AdminThrottle()
  @UseGuards(AdminAuthGuard)
  @Get()
  async listEnquiries(): Promise<EnquiryDto[]> {
    return this.enquiriesService.listEnquiries();
  }

  // ADMIN ONLY — status is the single mutable field.
  @AdminThrottle()
  @UseGuards(AdminAuthGuard)
  @Patch(":id")
  async updateStatus(@Param("id") id: string, @Body() body: unknown): Promise<EnquiryDto> {
    const parsed = updateEnquiryStatusSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.enquiriesService.updateStatus(id, parsed.data);
  }
}
