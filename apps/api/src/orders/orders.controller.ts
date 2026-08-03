import { BadRequestException, Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AdminThrottle } from "../common/throttle";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { OrdersService } from "./orders.service";
import { createOrderSchema, updateOrderSchema, type OrderDto } from "./orders.schema";

/**
 * Every route here is admin-only. There is deliberately no public endpoint.
 *
 * A customer-facing order lookup is listed as a confirmed policy in
 * AGENTS.md ("look up an order by ID or phone number"), but *what* a customer
 * may see, and whether a phone number alone is sufficient to identify
 * someone, are both undecided. Building it would mean inventing that policy.
 * See docs/api.md for the specific questions that need answering.
 */
@Controller("api/orders")
@AdminThrottle()
@UseGuards(AdminAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async list(): Promise<OrderDto[]> {
    return this.ordersService.list();
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: unknown): Promise<OrderDto> {
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.ordersService.create(parsed.data);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: unknown): Promise<OrderDto> {
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.ordersService.update(id, parsed.data);
  }
}
