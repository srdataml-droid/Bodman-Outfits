import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  AppointmentDto,
  AppointmentReceiptDto,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TIMES,
  CreateAppointmentDto,
} from "./appointments.schema";

// Upper bound on the admin list. Appointments are low-volume for a single
// business, so a real pagination contract would be premature — but an
// unbounded list endpoint would degrade silently as rows accumulate, so it
// is capped rather than left open. Add proper pagination (see
// docs/api.md) if this cap is ever actually reached.
const MAX_LIST_SIZE = 200;

interface AppointmentRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  preferredDate: Date;
  preferredTime: (typeof APPOINTMENT_TIMES)[number];
  category: string;
  notes: string | null;
  status: (typeof APPOINTMENT_STATUSES)[number];
  createdAt: Date;
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAppointment(input: CreateAppointmentDto): Promise<AppointmentReceiptDto> {
    const appointment = await this.prisma.appointment.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        // Anchored to UTC midnight so the stored DATE is exactly the day the
        // customer picked, with no chance of a local timezone shifting it.
        preferredDate: new Date(`${input.preferredDate}T00:00:00.000Z`),
        preferredTime: input.preferredTime,
        category: input.category,
        notes: input.notes ?? null,
        // status is never taken from input — the customer cannot self-confirm
        // a booking. It defaults to `pending` for Admin to act on.
      },
    });
    return { id: appointment.id, status: appointment.status };
  }

  async listAppointments(): Promise<AppointmentDto[]> {
    const appointments = await this.prisma.appointment.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_LIST_SIZE,
    });
    return appointments.map((appointment) => this.toDto(appointment));
  }

  // Explicitly rebuilds each row so any column added to the model later
  // cannot leak into the API response without a deliberate change here —
  // same pattern as ShopSettingsService.toDto and FaqService.toDto.
  private toDto(appointment: AppointmentRow): AppointmentDto {
    const { id, name, phone, email, preferredTime, category, notes, status } = appointment;
    return {
      id,
      name,
      phone,
      email,
      // Serialised back to the same YYYY-MM-DD calendar day that was
      // submitted, rather than a full timestamp implying a precision the
      // customer never supplied.
      preferredDate: appointment.preferredDate.toISOString().slice(0, 10),
      preferredTime,
      category,
      notes,
      status,
      createdAt: appointment.createdAt.toISOString(),
    };
  }
}
