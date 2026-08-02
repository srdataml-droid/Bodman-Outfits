import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateFaqDto, FaqDto, UpdateFaqDto } from "./faq.schema";

interface FaqRow {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sortOrder: number;
}

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async listFaqs(): Promise<FaqDto[]> {
    // Public: GET /api/faqs is unauthenticated public content.
    const faqs = await this.prisma.publicDb.faq.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return faqs.map((faq) => this.toDto(faq));
  }

  // Everything below is admin-only and therefore uses adminDb. The public
  // role has no write grant on Faq at all, so routing any of these through
  // publicDb would fail loudly rather than silently succeed.
  async createFaq(input: CreateFaqDto): Promise<FaqDto> {
    const faq = await this.prisma.adminDb.faq.create({
      data: {
        question: input.question,
        answer: input.answer,
        category: input.category ?? null,
        sortOrder: input.sortOrder,
      },
    });
    return this.toDto(faq);
  }

  async updateFaq(id: string, input: UpdateFaqDto): Promise<FaqDto> {
    await this.assertExists(id);
    const faq = await this.prisma.adminDb.faq.update({ where: { id }, data: input });
    return this.toDto(faq);
  }

  async deleteFaq(id: string): Promise<void> {
    await this.assertExists(id);
    await this.prisma.adminDb.faq.delete({ where: { id } });
  }

  // Checked explicitly so a missing row returns 404 rather than surfacing
  // Prisma's P2025 as a bare 500, which is the rough edge already noted for
  // ShopSettings in docs/api.md.
  private async assertExists(id: string): Promise<void> {
    const existing = await this.prisma.adminDb.faq.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException(`No FAQ with id ${id}`);
  }

  // Explicitly rebuilds each row so internal fields (createdAt, updatedAt)
  // can never leak into the public API shape.
  private toDto(faq: FaqRow): FaqDto {
    const { id, question, answer, category, sortOrder } = faq;
    return { id, question, answer, category, sortOrder };
  }
}
