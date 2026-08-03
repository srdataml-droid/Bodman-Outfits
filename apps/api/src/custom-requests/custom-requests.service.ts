import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  CreateCustomRequestDto,
  CustomRequestDto,
  CustomRequestReceiptDto,
  CustomRequestStatus,
  ReviewCustomRequestDto,
} from "./custom-requests.schema";

const MAX_LIST_SIZE = 200;

interface Row {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string;
  category: string | null;
  status: CustomRequestStatus;
  declineReason: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class CustomRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateCustomRequestDto): Promise<CustomRequestReceiptDto> {
    const created = await this.prisma.publicDb.customRequest.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        description: input.description,
        category: input.category ?? null,
      },
      // Narrow RETURNING to match the column-level grant the public role
      // holds. Returning every column would fail with a permission error.
      select: { id: true, status: true },
    });
    return { id: created.id, status: created.status };
  }

  // Oldest first, per the skill's "review queue, oldest first". This is the
  // one list in the product that is not newest-first, because a queue is
  // worked from the front.
  async list(): Promise<CustomRequestDto[]> {
    const rows = await this.prisma.adminDb.customRequest.findMany({
      orderBy: { createdAt: "asc" },
      take: MAX_LIST_SIZE,
    });
    return rows.map((r) => this.toDto(r));
  }

  async review(id: string, adminId: string, input: ReviewCustomRequestDto): Promise<CustomRequestDto> {
    const existing = await this.prisma.adminDb.customRequest.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException(`No custom request with id ${id}`);

    const updated = await this.prisma.adminDb.customRequest.update({
      where: { id },
      data: {
        status: input.status,
        // Cleared when moving back to pending or accepting, so a stale reason
        // cannot linger against a request that is no longer declined.
        declineReason: input.status === "declined" ? (input.declineReason ?? null) : null,
        reviewedById: input.status === "pending_review" ? null : adminId,
        reviewedAt: input.status === "pending_review" ? null : new Date(),
      },
    });
    return this.toDto(updated);
  }

  private toDto(r: Row): CustomRequestDto {
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      description: r.description,
      category: r.category,
      status: r.status,
      declineReason: r.declineReason,
      reviewedById: r.reviewedById,
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
