import { createHash, randomBytes } from "crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import type { LoginDto } from "./auth.schema";
import { SESSION_TTL_MS } from "./session-cookie";

export interface AdminIdentity {
  id: string;
  email: string;
}

export interface AdminSessionResult extends AdminIdentity {
  token: string;
}

// Valid-format bcrypt hash of an unguessable, unused password, computed once
// at module load. Used to run bcrypt.compare on an unknown-email login so
// the response takes the same time whether the email exists or not — a real
// hash comparison, not an early return, so timing can't reveal which case
// it was.
const DUMMY_HASH = bcrypt.hashSync(randomBytes(32).toString("hex"), 10);

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(credentials: LoginDto): Promise<AdminSessionResult> {
    const admin = await this.prisma.admin.findUnique({ where: { email: credentials.email } });
    const valid = await bcrypt.compare(credentials.password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !valid) {
      // Same message either way — never reveal whether the email exists.
      throw new UnauthorizedException("Invalid email or password");
    }

    const token = randomBytes(32).toString("hex");
    await this.prisma.adminSession.create({
      data: {
        tokenHash: hashToken(token),
        adminId: admin.id,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });

    return { token, id: admin.id, email: admin.email };
  }

  async logout(token: string): Promise<void> {
    await this.prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  async validateSession(token: string): Promise<AdminIdentity | null> {
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { admin: true },
    });
    if (!session || session.expiresAt.getTime() < Date.now()) {
      return null;
    }
    return { id: session.admin.id, email: session.admin.email };
  }
}
