# Database

Purpose: Document the data model, entity relationships, data ownership, storage decisions, migration practices, and data-retention requirements.

## Admin / AdminSession (2026-08-02)

The only authenticated role in the platform (AGENTS.md — Confirmed Product
Policies). Full contract in `docs/api.md` under "Admin Authentication".

```prisma
model Admin {
  id           String         @id @default(cuid())
  email        String         @unique
  passwordHash String
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  sessions     AdminSession[]
}

model AdminSession {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  adminId   String
  admin     Admin    @relation(fields: [adminId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([adminId])
}
```

- `passwordHash` — bcrypt hash only (`bcryptjs`, cost 12). Never stored or
  returned as plaintext anywhere.
- `AdminSession.tokenHash` is a SHA-256 hash of the session token; the raw
  token exists only in the client's httpOnly cookie, never persisted. A
  database read alone can never reconstruct a valid session, same principle
  as `passwordHash`.
- `onDelete: Cascade` on the `Admin` relation — deleting an admin account
  also deletes all of its sessions, so no orphaned session rows can outlive
  the account they authenticate.
- No seed data. No admin account is created with invented credentials — see
  `prisma/bootstrap-admin.ts` and `docs/api.md` for the bootstrap flow, which
  requires the owner to supply real `ADMIN_BOOTSTRAP_EMAIL` /
  `ADMIN_BOOTSTRAP_PASSWORD` values in `.env` themselves.
- Migration: `prisma/migrations/20260802210000_add_admin_auth/`. Generated
  via `prisma migrate diff --from-schema <prior> --to-schema
  prisma/schema.prisma --script` (pure schema-to-schema diff, no live
  database or shadow database touched to generate the file), same pattern
  used for the `add_faq` migration. **Applied to the real Supabase database**
  2026-08-02 via `prisma migrate deploy`, after explicit go-ahead — verified
  `Admin`/`AdminSession` both exist with 0 rows (see `logs/decisions.md`).
