import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateGarmentDto, GarmentDto, UpdateGarmentDto } from "./garments.schema";

interface GarmentRow {
  id: string;
  slug: string;
  category: string;
  name: string;
  detail: string;
  description: string;
  imageFlat: string;
  imageOnForm: string;
  altFlat: string;
  altOnForm: string;
  startingPrice: number | null;
  active: boolean;
  sortOrder: number;
}

@Injectable()
export class GarmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public catalogue read. Active garments only.
   *
   * The `active` filter is belt AND braces: the row-level security policy on
   * this table already restricts atelier_api_public to `active = true`, so
   * removing this where-clause would change nothing. It stays because the
   * intent should be readable at the call site, not only in a migration.
   */
  async listPublic(): Promise<GarmentDto[]> {
    const garments = await this.prisma.publicDb.garment.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
    return garments.map((garment) => this.toDto(garment));
  }

  /** Admin list: includes deactivated garments, which the public list cannot see. */
  async listAll(): Promise<GarmentDto[]> {
    const garments = await this.prisma.adminDb.garment.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
    return garments.map((garment) => this.toDto(garment));
  }

  async create(input: CreateGarmentDto): Promise<GarmentDto> {
    await this.assertSlugFree(input.category, input.slug);
    const garment = await this.prisma.adminDb.garment.create({
      data: {
        slug: input.slug,
        category: input.category,
        name: input.name,
        detail: input.detail,
        description: input.description,
        imageFlat: input.imageFlat,
        imageOnForm: input.imageOnForm,
        altFlat: input.altFlat,
        altOnForm: input.altOnForm,
        startingPrice: input.startingPrice ?? null,
        active: input.active ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return this.toDto(garment);
  }

  async update(id: string, input: UpdateGarmentDto): Promise<GarmentDto> {
    const existing = await this.findOrThrow(id);

    // A slug or category change can collide with another row, and the unique
    // index would surface that as a bare 500. Checked here so it becomes a
    // 409 the dashboard can render as a sentence.
    const nextCategory = input.category ?? existing.category;
    const nextSlug = input.slug ?? existing.slug;
    if (nextCategory !== existing.category || nextSlug !== existing.slug) {
      await this.assertSlugFree(nextCategory, nextSlug);
    }

    const garment = await this.prisma.adminDb.garment.update({ where: { id }, data: input });
    return this.toDto(garment);
  }

  /**
   * Deactivate rather than delete.
   *
   * Withdrawing a piece from sale should not destroy its copy, its image
   * paths or the favorites customers hold against its slug. `DELETE` exists
   * on the controller for genuine mistakes; this is what the dashboard's
   * primary action uses.
   */
  async setActive(id: string, active: boolean): Promise<GarmentDto> {
    await this.findOrThrow(id);
    const garment = await this.prisma.adminDb.garment.update({ where: { id }, data: { active } });
    return this.toDto(garment);
  }

  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.adminDb.garment.delete({ where: { id } });
  }

  private async assertSlugFree(category: string, slug: string): Promise<void> {
    const clash = await this.prisma.adminDb.garment.findUnique({
      where: { category_slug: { category, slug } },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictException(`A garment with slug "${slug}" already exists in ${category}`);
    }
  }

  private async findOrThrow(id: string): Promise<GarmentRow> {
    const existing = await this.prisma.adminDb.garment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`No garment with id ${id}`);
    return existing;
  }

  // Rebuilt explicitly so createdAt/updatedAt cannot leak into the API shape.
  private toDto(garment: GarmentRow): GarmentDto {
    const {
      id,
      slug,
      category,
      name,
      detail,
      description,
      imageFlat,
      imageOnForm,
      altFlat,
      altOnForm,
      startingPrice,
      active,
      sortOrder,
    } = garment;
    return {
      id,
      slug,
      category,
      name,
      detail,
      description,
      imageFlat,
      imageOnForm,
      altFlat,
      altOnForm,
      startingPrice,
      active,
      sortOrder,
    };
  }
}
