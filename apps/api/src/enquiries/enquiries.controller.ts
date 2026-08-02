import { BadRequestException, Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { EnquiriesService } from "./enquiries.service";
import { type EnquiryDto, type EnquiryReceiptDto, createEnquirySchema } from "./enquiries.schema";

@Controller("api/enquiries")
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  // PUBLIC — customers have no accounts. Rate-limited to 5 per minute per IP,
  // matching appointments and login. Same deliberate looseness for the same
  // reason: carrier-level NAT means an aggressive per-IP limit blocks real
  // customers without stopping an attacker who can rotate addresses.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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
  @UseGuards(AdminAuthGuard)
  @Get()
  async listEnquiries(): Promise<EnquiryDto[]> {
    return this.enquiriesService.listEnquiries();
  }
}
