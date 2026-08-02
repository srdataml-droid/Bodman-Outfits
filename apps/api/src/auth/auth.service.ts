import { createHash, randomBytes } from "crypto";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import type { ChangeEmailDto, ChangePasswordDto, LoginDto } from "./auth.schema";
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
    const admin = await this.prisma.adminDb.admin.findUnique({ where: { email: credentials.email } });
    const valid = await bcrypt.compare(credentials.password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !valid) {
      // Same message either way — never reveal whether the email exists.
      throw new UnauthorizedException("Invalid email or password");
    }

    const token = randomBytes(32).toString("hex");
    await this.prisma.adminDb.adminSession.create({
      data: {
        tokenHash: hashToken(token),
        adminId: admin.id,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });

    return { token, id: admin.id, email: admin.email };
  }

  async logout(token: string): Promise<void> {
    await this.prisma.adminDb.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  async validateSession(token: string): Promise<AdminIdentity | null> {
    const session = await this.prisma.adminDb.adminSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { admin: true },
    });
    if (!session || session.expiresAt.getTime() < Date.now()) {
      return null;
    }
    return { id: session.admin.id, email: session.admin.email };
  }

  // Both self-service changes below re-verify the current password even
  // though the caller already holds a valid session. A stolen or
  // left-open session should not be enough to take permanent ownership of
  // the account by rotating its credentials.
  async changePassword(adminId: string, currentSessionToken: string, input: ChangePasswordDto): Promise<void> {
    const admin = await this.prisma.adminDb.admin.findUnique({ where: { id: adminId } });
    if (!admin || !(await bcrypt.compare(input.currentPassword, admin.passwordHash))) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    // Rotating the password revokes every other session. Deleting all of
    // them and keeping only the caller's is deliberate: if the reason for
    // the change is that a session leaked, leaving the other sessions alive
    // would defeat the entire point. The caller keeps their own session so
    // that changing a password does not log you out of the screen you are
    // standing in front of.
    await this.prisma.adminDb.$transaction([
      this.prisma.adminDb.admin.update({ where: { id: adminId }, data: { passwordHash } }),
      this.prisma.adminDb.adminSession.deleteMany({
        where: { adminId, NOT: { tokenHash: hashToken(currentSessionToken) } },
      }),
    ]);
  }

  async changeEmail(adminId: string, input: ChangeEmailDto): Promise<{ email: string }> {
    const admin = await this.prisma.adminDb.admin.findUnique({ where: { id: adminId } });
    if (!admin || !(await bcrypt.compare(input.currentPassword, admin.passwordHash))) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const existing = await this.prisma.adminDb.admin.findUnique({ where: { email: input.newEmail } });
    if (existing && existing.id !== adminId) {
      throw new ConflictException("That email address is already in use");
    }

    // Sessions are intentionally left intact. An email change does not
    // invalidate the credential that sessions were established against, so
    // there is nothing to revoke.
    const updated = await this.prisma.adminDb.admin.update({
      where: { id: adminId },
      data: { email: input.newEmail },
    });
    return { email: updated.email };
  }
}
