import { BadRequestException, Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { ShopSettingsService } from "./shop-settings.service";
import { type ShopSettingsDto, updateShopSettingsSchema } from "./shop-settings.schema";

@Controller("api/shop-settings")
export class ShopSettingsController {
  constructor(private readonly shopSettingsService: ShopSettingsService) {}

  @Get()
  async getShopSettings(): Promise<ShopSettingsDto> {
    return this.shopSettingsService.getSettings();
  }

  @UseGuards(AdminAuthGuard)
  @Put()
  async updateShopSettings(@Body() body: unknown): Promise<ShopSettingsDto> {
    const parsed = updateShopSettingsSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.shopSettingsService.updateSettings(parsed.data);
  }
}
