import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../generated/prisma/client";

// Fail at boot rather than fall back to a broader connection.
//
// The obvious-looking convenience here would be to default to DATABASE_URL
// when a scoped variable is missing. That would be the wrong call: a
// deployment with a typo'd variable name would silently run every request as
// the BYPASSRLS role, which is exactly the state this split exists to end,
// and nothing would look wrong. Refusing to start is noisy, immediate and
// safe.
function requireConnection(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. apps/api requires the scoped database roles ` +
        `(DATABASE_URL_PUBLIC and DATABASE_URL_ADMIN). It deliberately does not ` +
        `fall back to DATABASE_URL, because that role holds BYPASSRLS and would ` +
        `silently give every request full access. See docs/deployment-readiness.md.`,
    );
  }
  return value;
}

/**
 * Holds two database connections, one per privilege level.
 *
 * `publicDb` connects as `atelier_api_public`, which can read ShopSettings
 * and Faq and insert Appointment and Enquiry rows. Nothing else. It cannot
 * read customer personal data, admin password hashes or session tokens.
 *
 * `adminDb` connects as `atelier_api_admin`, which can run the authenticated
 * surface. It can read customer data and manage sessions, but still cannot
 * insert or delete Admin rows.
 *
 * Neither role holds BYPASSRLS, so the policies added in
 * `20260803000000_enable_rls` genuinely apply to both. Migrations and seeds
 * continue to use DATABASE_URL/DIRECT_URL, which is correct: schema changes
 * legitimately need privileges the running application should never have.
 *
 * WHICH ONE TO USE: pick by what the *endpoint* exposes, not by what is
 * convenient. A method reachable without `AdminAuthGuard` must use
 * `publicDb`. If you reach for `adminDb` in an unguarded path, that is the
 * signal to check whether the endpoint should have been guarded.
 *
 * The failure mode is deliberately the right way round. Using `publicDb`
 * where `adminDb` was needed produces an immediate, loud Postgres permission
 * error. The reverse mistake is the dangerous one, which is why the split is
 * explicit at every call site rather than inferred.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly publicDb: PrismaClient;
  readonly adminDb: PrismaClient;

  constructor() {
    this.publicDb = new PrismaClient({
      adapter: new PrismaPg({ connectionString: requireConnection("DATABASE_URL_PUBLIC") }),
    });
    this.adminDb = new PrismaClient({
      adapter: new PrismaPg({ connectionString: requireConnection("DATABASE_URL_ADMIN") }),
    });
  }

  async onModuleInit(): Promise<void> {
    await Promise.all([this.publicDb.$connect(), this.adminDb.$connect()]);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.publicDb.$disconnect(), this.adminDb.$disconnect()]);
  }
}
