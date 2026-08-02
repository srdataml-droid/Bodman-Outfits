import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { FaqDto } from "./faq.schema";

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
    const faqs = await this.prisma.faq.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return faqs.map((faq) => this.toDto(faq));
  }

  // Explicitly rebuilds each row so internal fields (createdAt, updatedAt)
  // can never leak into the public API shape.
  private toDto(faq: FaqRow): FaqDto {
    const { id, question, answer, category, sortOrder } = faq;
    return { id, question, answer, category, sortOrder };
  }
}
