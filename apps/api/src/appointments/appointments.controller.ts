import { BadRequestException, Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { AppointmentsService } from "./appointments.service";
import {
  type AppointmentDto,
  type AppointmentReceiptDto,
  createAppointmentSchema,
} from "./appointments.schema";

@Controller("api/appointments")
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // PUBLIC — customers have no accounts (AGENTS.md: "Customers never have
  // accounts, passwords, or sessions"), so this is intentionally
  // unauthenticated. Being open, it is rate-limited to 5 submissions per
  // minute per IP, matching the login limit. That is deliberately not
  // tighter: mobile carriers in Nigeria commonly NAT many users behind one
  // address, so an aggressive per-IP limit would block real customers to
  // stop a spammer who can rotate addresses anyway. Volume abuse is
  // additionally bounded by the field length caps in appointments.schema.ts.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  @HttpCode(201)
  async createAppointment(@Body() body: unknown): Promise<AppointmentReceiptDto> {
    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.appointmentsService.createAppointment(parsed.data);
  }

  // ADMIN ONLY — appointment records contain customer names, phone numbers
  // and email addresses. This must never ship unguarded.
  @UseGuards(AdminAuthGuard)
  @Get()
  async listAppointments(): Promise<AppointmentDto[]> {
    return this.appointmentsService.listAppointments();
  }
}
