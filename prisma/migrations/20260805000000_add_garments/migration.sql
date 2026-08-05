-- CreateTable
CREATE TABLE "Garment" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageFlat" TEXT NOT NULL,
    "imageOnForm" TEXT NOT NULL,
    "altFlat" TEXT NOT NULL,
    "altOnForm" TEXT NOT NULL,
    "startingPrice" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Garment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Garment_category_active_idx" ON "Garment"("category", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Garment_category_slug_key" ON "Garment"("category", "slug");


-- ---------------------------------------------------------------------------
-- Row level security and grants, following 20260803020000.
--
-- Omitting this block would create the table with RLS off and no grants to
-- the scoped roles, so the public catalogue would silently render as empty
-- (SELECT returning nothing is the quiet half of the failure) and every admin
-- write would error. ALTER DEFAULT PRIVILEGES from 20260803000000_enable_rls
-- already prevents anon/authenticated receiving grants here.
-- ---------------------------------------------------------------------------
ALTER TABLE "Garment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Garment" FORCE ROW LEVEL SECURITY;

-- Public surface: the catalogue is public content, like ShopSettings and Faq.
-- Full-row SELECT is correct here; there is no customer data on this table.
GRANT SELECT ON "Garment" TO atelier_api_public;

-- The `active = true` predicate is enforced in the POLICY, not only in the
-- application query. An inactive garment is a piece the business has pulled
-- from sale; a forgotten .where({ active: true }) in some future endpoint
-- should not be the only thing standing between it and the public site.
CREATE POLICY "public_role_reads_active_garments" ON "Garment"
  FOR SELECT TO atelier_api_public USING ("active" = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON "Garment" TO atelier_api_admin;

CREATE POLICY "admin_role_manages_garments" ON "Garment"
  FOR ALL TO atelier_api_admin USING (true) WITH CHECK (true);
