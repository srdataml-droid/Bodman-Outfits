import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import type {
  UpdateAppointmentStatusDto,
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
  email: string;
  phone: string | null;
  preferredDate: Date;
  preferredTime: (typeof APPOINTMENT_TIMES)[number];
  category: string;
  notes: string | null;
  status: (typeof APPOINTMENT_STATUSES)[number];
  createdAt: Date;
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createAppointment(input: CreateAppointmentDto): Promise<AppointmentReceiptDto> {
    // Public: customers submit these unauthenticated.
    const appointment = await this.prisma.publicDb.appointment.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        // Anchored to UTC midnight so the stored DATE is exactly the day the
        // customer picked, with no chance of a local timezone shifting it.
        preferredDate: new Date(`${input.preferredDate}T00:00:00.000Z`),
        preferredTime: input.preferredTime,
        category: input.category,
        notes: input.notes ?? null,
        // status is never taken from input — the customer cannot self-confirm
        // a booking. It defaults to `pending` for Admin to act on.
      },
      // Restricts the RETURNING clause to exactly the two columns the
      // public role holds a column-level SELECT grant on. Without this,
      // Prisma returns every column and Postgres refuses the insert.
      select: { id: true, status: true },
    });
    // Not awaited, and never able to reject. See NotificationsService: a
    // notification failure must never cost the customer their booking.
    // Built from `input` because the public role cannot SELECT these columns
    // back out of the row it just wrote.
    void this.notifications.notifyNewSubmission({
      kind: "appointment",
      recordId: appointment.id,
      customerName: input.name,
      customerEmail: input.email,
      details: [
        ["Category", input.category],
        ["Preferred date", input.preferredDate],
        ["Preferred time", input.preferredTime],
        ["Email", input.email],
        ["Phone", input.phone ?? "not given"],
        ["Notes", input.notes ?? "none"],
      ],
    });

    return { id: appointment.id, status: appointment.status };
  }

  async listAppointments(): Promise<AppointmentDto[]> {
    // Admin: these rows contain customer personal data.
    const appointments = await this.prisma.adminDb.appointment.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_LIST_SIZE,
    });
    return appointments.map((appointment) => this.toDto(appointment));
  }


  // Admin-only. Uses adminDb: the public role has no UPDATE grant on
  // Appointment at all, so routing this through publicDb would fail loudly.
  async updateStatus(id: string, input: UpdateAppointmentStatusDto): Promise<AppointmentDto> {
    const existing = await this.prisma.adminDb.appointment.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException(`No appointment with id ${id}`);
    const updated = await this.prisma.adminDb.appointment.update({
      where: { id },
      data: { status: input.status },
    });
    return this.toDto(updated);
  }

  // Explicitly rebuilds each row so any column added to the model later
  // cannot leak into the API response without a deliberate change here —
  // same pattern as ShopSettingsService.toDto and FaqService.toDto.
  private toDto(appointment: AppointmentRow): AppointmentDto {
    const { id, name, email, phone, preferredTime, category, notes, status } = appointment;
    return {
      id,
      name,
      email,
      phone,
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