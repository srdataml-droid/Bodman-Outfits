import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AdminThrottle } from "../common/throttle";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { GarmentsService } from "./garments.service";
import { createGarmentSchema, updateGarmentSchema, type GarmentDto } from "./garments.schema";
import { z } from "zod";

const setActiveSchema = z.object({ active: z.boolean() });

@Controller("api/garments")
export class GarmentsController {
  constructor(private readonly garmentsService: GarmentsService) {}

  // Public: the catalogue. Active garments only, enforced by both the query
  // and the row-level security policy.
  @Get()
  async listGarments(): Promise<GarmentDto[]> {
    return this.garmentsService.listPublic();
  }

  /*
   * Separate admin listing rather than a ?includeInactive flag on the public
   * route. A query parameter that widens what a public endpoint returns is
   * one forgotten guard away from publishing withdrawn pieces; a distinct
   * guarded path cannot be reached by accident.
   */
  @AdminThrottle()
  @UseGuards(AdminAuthGuard)
  @Get("all")
  async listAllGarments(): Promise<GarmentDto[]> {
    return this.garmentsService.listAll();
  }

  @AdminThrottle()
  @UseGuards(AdminAuthGuard)
  @Post()
  @HttpCode(201)
  async createGarment(@Body() body: unknown): Promise<GarmentDto> {
    const parsed = createGarmentSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.garmentsService.create(parsed.data);
  }

  @AdminThrottle()
  @UseGuards(AdminAuthGuard)
  @Put(":id")
  async updateGarment(@Param("id") id: string, @Body() body: unknown): Promise<GarmentDto> {
    const parsed = updateGarmentSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.garmentsService.update(id, parsed.data);
  }

  @AdminThrottle()
  @UseGuards(AdminAuthGuard)
  @Patch(":id/active")
  async setGarmentActive(@Param("id") id: string, @Body() body: unknown): Promise<GarmentDto> {
    const parsed = setActiveSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.garmentsService.setActive(id, parsed.data.active);
  }

  @AdminThrottle()
  @UseGuards(AdminAuthGuard)
  @Delete(":id")
  @HttpCode(204)
  async deleteGarment(@Param("id") id: string): Promise<void> {
    await this.garmentsService.remove(id);
  }
}
