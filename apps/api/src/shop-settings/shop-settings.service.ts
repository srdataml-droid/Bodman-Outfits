import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { ShopSettingsDto, UpdateShopSettingsDto } from "./shop-settings.schema";

// Fixed singleton row id — see prisma/seed.ts. Must match.
const SINGLETON_ID = "singleton";

interface ShopSettingsRow {
  shopName: string;
  tagline: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  cityCountry: string;
  hoursWeekday: string;
  hoursSaturday: string;
  hoursSunday: string;
  pricingNote: string;
  depositPercentage: number;
}

@Injectable()
export class ShopSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<ShopSettingsDto> {
    // Public: GET /api/shop-settings is unauthenticated display content.
    const settings = await this.prisma.publicDb.shopSettings.findUnique({ where: { id: SINGLETON_ID } });
    if (!settings) {
      throw new InternalServerErrorException(
        "ShopSettings has not been seeded. Run `prisma db seed` against a configured DATABASE_URL.",
      );
    }
    return this.toDto(settings);
  }

  async updateSettings(update: UpdateShopSettingsDto): Promise<ShopSettingsDto> {
    // Admin: PUT is behind AdminAuthGuard.
    const settings = await this.prisma.adminDb.shopSettings.update({
      where: { id: SINGLETON_ID },
      data: update,
    });
    return this.toDto(settings);
  }

  // Explicitly rebuilds the response so internal fields (id, createdAt,
  // updatedAt) can never leak into the public API shape — it must match
  // the ShopSettings interface in docs/api.md exactly.
  private toDto(settings: ShopSettingsRow): ShopSettingsDto {
    const {
      shopName,
      tagline,
      phone,
      whatsappNumber,
      email,
      address,
      cityCountry,
      hoursWeekday,
      hoursSaturday,
      hoursSunday,
      pricingNote,
      depositPercentage,
    } = settings;
    return {
      shopName,
      tagline,
      phone,
      whatsappNumber,
      email,
      address,
      cityCountry,
      hoursWeekday,
      hoursSaturday,
      hoursSunday,
      pricingNote,
      depositPercentage,
    };
  }
}
