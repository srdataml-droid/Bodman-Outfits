import { Controller, Get } from "@nestjs/common";
import { FaqService } from "./faq.service";
import type { FaqDto } from "./faq.schema";

// ============================================================================
// SCOPE DECISION — no POST/PUT/DELETE here, GET only.
//
// Admin-editable FAQ management (create/edit/delete/reorder) is a real,
// documented product requirement (see docs/ui-ux.md, docs/api.md), but is
// deliberately not built yet rather than shipped as stubbed-open write
// endpoints, unlike ShopSettings PUT. Two reasons:
//
//   1. No Admin auth exists anywhere in this repo (same gap as
//      ShopSettings), so any write endpoint here would be just as
//      unauthenticated-open — adding a SECOND open write endpoint to the
//      deployment blocker list for no functional gain, since nothing
//      calls it yet (no apps/admin exists).
//   2. Unlike ShopSettings, there is no already-approved request/response
//      contract for FAQ writes (single vs. bulk update, hard vs. soft
//      delete, how reordering works). Building it now would mean
//      inventing an unapproved API shape, not just leaving a shape
//      unauthenticated.
//
// GET is read-only public content — same risk profile as the hardcoded
// array it replaces. Build the write endpoints alongside real Admin auth,
// as one piece of work, not before it. See docs/api.md.
// ============================================================================
@Controller("api/faqs")
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  async listFaqs(): Promise<FaqDto[]> {
    return this.faqService.listFaqs();
  }
}
