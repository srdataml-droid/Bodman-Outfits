import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateOrderDto, OrderDto, OrderStatus, UpdateOrderDto } from "./orders.schema";

const MAX_LIST_SIZE = 200;

interface Row {
  id: string;
  appointmentId: string | null;
  enquiryId: string | null;
  customRequestId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  status: OrderStatus;
  notes: string | null;
  totalAmount: unknown;
  depositAmount: unknown;
  currency: string | null;
  createdAt: Date;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Admin-only throughout. There is no public order endpoint at all, so
  // every method here uses adminDb and the public role holds no grant on
  // the table.
  async list(): Promise<OrderDto[]> {
    const rows = await this.prisma.adminDb.order.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_LIST_SIZE,
    });
    return rows.map((r) => this.toDto(r as Row));
  }

  async create(input: CreateOrderDto): Promise<OrderDto> {
    // The source request must exist. Checking here rather than relying on the
    // foreign key gives a 404 naming the problem instead of a raw constraint
    // violation surfacing as a 500.
    await this.assertSourceExists(input.source, input.sourceId);

    const created = await this.prisma.adminDb.order.create({
      data: {
        appointmentId: input.source === "appointment" ? input.sourceId : null,
        enquiryId: input.source === "enquiry" ? input.sourceId : null,
        customRequestId: input.source === "customRequest" ? input.sourceId : null,
        customerName: input.customerName,
        customerPhone: input.customerPhone ?? null,
        customerEmail: input.customerEmail ?? null,
        notes: input.notes ?? null,
        totalAmount: input.totalAmount ?? null,
        depositAmount: input.depositAmount ?? null,
        currency: input.currency ?? null,
      },
    });
    return this.toDto(created as Row);
  }

  async update(id: string, input: UpdateOrderDto): Promise<OrderDto> {
    // `status` is selected as well as `id` because the ready notice must fire
    // on the TRANSITION into `ready`, not on the state. Without the previous
    // value, every later save on an already-ready order - correcting a note,
    // recording a payment - would send the customer another "your garment is
    // ready", which is how a helpful message becomes a nuisance.
    const existing = await this.prisma.adminDb.order.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException(`No order with id ${id}`);
    const updated = await this.prisma.adminDb.order.update({
      where: { id },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.totalAmount !== undefined ? { totalAmount: input.totalAmount } : {}),
        ...(input.depositAmount !== undefined ? { depositAmount: input.depositAmount } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
      },
    });

    // Not awaited, and it cannot reject: marking an order ready must never
    // fail because an email provider is down. The status change is the
    // record; the message is a courtesy on top of it.
    if (input.status === "ready" && existing.status !== "ready") {
      void this.notifications.notifyOrderReady({
        id: updated.id,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
      });
    }

    return this.toDto(updated as Row);
  }

  private async assertSourceExists(source: string, id: string): Promise<void> {
    const found =
      source === "appointment"
        ? await this.prisma.adminDb.appointment.findUnique({ where: { id }, select: { id: true } })
        : source === "enquiry"
          ? await this.prisma.adminDb.enquiry.findUnique({ where: { id }, select: { id: true } })
          : await this.prisma.adminDb.customRequest.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new BadRequestException(`No ${source} with id ${id}`);
  }

  private toDto(r: Row): OrderDto {
    const source = r.appointmentId
      ? ("appointment" as const)
      : r.enquiryId
        ? ("enquiry" as const)
        : r.customRequestId
          ? ("customRequest" as const)
          : null;
    return {
      id: r.id,
      source,
      sourceId: r.appointmentId ?? r.enquiryId ?? r.customRequestId,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      customerEmail: r.customerEmail,
      status: r.status,
      notes: r.notes,
      // Decimal is serialised as a string so no precision is lost passing it
      // through JSON, which has only IEEE 754 doubles.
      totalAmount: r.totalAmount === null ? null : String(r.totalAmount),
      depositAmount: r.depositAmount === null ? null : String(r.depositAmount),
      currency: r.currency,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
