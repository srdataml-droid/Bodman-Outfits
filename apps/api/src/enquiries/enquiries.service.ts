import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  CreateEnquiryDto,
  EnquiryDto,
  EnquiryReceiptDto,
  ENQUIRY_STATUSES,
} from "./enquiries.schema";

// Same bound and same reasoning as AppointmentsService: low volume for a
// single business, so a pagination contract would be premature, but an
// unbounded list endpoint would degrade silently as rows accumulate.
const MAX_LIST_SIZE = 200;

interface EnquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: (typeof ENQUIRY_STATUSES)[number];
  createdAt: Date;
}

@Injectable()
export class EnquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async createEnquiry(input: CreateEnquiryDto): Promise<EnquiryReceiptDto> {
    const enquiry = await this.prisma.enquiry.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        subject: input.subject,
        message: input.message,
        // status is never taken from input. A customer cannot mark their own
        // enquiry as replied to.
      },
    });
    return { id: enquiry.id, status: enquiry.status };
  }

  async listEnquiries(): Promise<EnquiryDto[]> {
    const enquiries = await this.prisma.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_LIST_SIZE,
    });
    return enquiries.map((enquiry) => this.toDto(enquiry));
  }

  // Explicit rebuild so a column added to the model later cannot leak into
  // the API response without a deliberate change here.
  private toDto(enquiry: EnquiryRow): EnquiryDto {
    const { id, name, email, phone, subject, message, status } = enquiry;
    return {
      id,
      name,
      email,
      phone,
      subject,
      message,
      status,
      createdAt: enquiry.createdAt.toISOString(),
    };
  }
}
