import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { FaqService } from "./faq.service";
import { createFaqSchema, updateFaqSchema, type FaqDto } from "./faq.schema";

// FAQ shipped GET-only originally because no consumer existed for the write
// endpoints and building them would have meant inventing an unapproved
// contract while there was no auth to guard them with. Both conditions have
// since changed: AdminAuthGuard exists and the admin dashboard consumes
// these. See docs/api.md.
@Controller("api/faqs")
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // Public: this is customer-facing content.
  @Get()
  async listFaqs(): Promise<FaqDto[]> {
    return this.faqService.listFaqs();
  }

  @UseGuards(AdminAuthGuard)
  @Post()
  @HttpCode(201)
  async createFaq(@Body() body: unknown): Promise<FaqDto> {
    const parsed = createFaqSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.faqService.createFaq(parsed.data);
  }

  @UseGuards(AdminAuthGuard)
  @Put(":id")
  async updateFaq(@Param("id") id: string, @Body() body: unknown): Promise<FaqDto> {
    const parsed = updateFaqSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.faqService.updateFaq(id, parsed.data);
  }

  @UseGuards(AdminAuthGuard)
  @Delete(":id")
  @HttpCode(204)
  async deleteFaq(@Param("id") id: string): Promise<void> {
    await this.faqService.deleteFaq(id);
  }
}
