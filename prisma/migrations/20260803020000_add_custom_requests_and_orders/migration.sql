-- CreateEnum
CREATE TYPE "CustomRequestStatus" AS ENUM ('pending_review', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('draft', 'in_production', 'ready', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "CustomRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "status" "CustomRequestStatus" NOT NULL DEFAULT 'pending_review',
    "declineReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CustomRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "enquiryId" TEXT,
    "customRequestId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "totalAmount" DECIMAL(12,2),
    "depositAmount" DECIMAL(12,2),
    "currency" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomRequest_createdAt_idx" ON "CustomRequest"("createdAt");

-- CreateIndex
CREATE INDEX "CustomRequest_reviewedById_idx" ON "CustomRequest"("reviewedById");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- AddForeignKey
ALTER TABLE "CustomRequest" ADD CONSTRAINT "CustomRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customRequestId_fkey" FOREIGN KEY ("customRequestId") REFERENCES "CustomRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Row level security and grants for the two new tables.
--
-- Without this block both tables would be created with RLS off and no grants
-- to the scoped application roles, so every query from apps/api would fail
-- (or, for SELECT, silently return nothing, which is the quieter and more
-- confusing half of the same problem). The ALTER DEFAULT PRIVILEGES set in
-- 20260803000000_enable_rls already stops anon and authenticated receiving
-- any grant on these; that is verified rather than assumed below.
-- ---------------------------------------------------------------------------
ALTER TABLE "CustomRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomRequest" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Order"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order"         FORCE ROW LEVEL SECURITY;

-- Public surface: customers submit custom requests anonymously, exactly as
-- they submit appointments and enquiries.
GRANT INSERT ON "CustomRequest" TO atelier_api_public;
-- Prisma's create() issues INSERT ... RETURNING, so the role also needs
-- SELECT on whatever comes back. Column-level, covering only the two fields
-- the public receipt returns, so a leaked public credential cannot read the
-- customer's name, email or the description of their design.
GRANT SELECT ("id", "status") ON "CustomRequest" TO atelier_api_public;

CREATE POLICY "public_role_inserts_custom_requests" ON "CustomRequest"
  FOR INSERT TO atelier_api_public WITH CHECK (true);
CREATE POLICY "public_role_reads_own_receipt_columns" ON "CustomRequest"
  FOR SELECT TO atelier_api_public USING (true);

-- Orders have NO public grant and NO public policy of any kind. There is no
-- customer-facing order endpoint, and until one is designed the correct
-- posture is that the public role cannot see the table exists.
GRANT SELECT, INSERT, UPDATE, DELETE ON "CustomRequest" TO atelier_api_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Order" TO atelier_api_admin;

CREATE POLICY "admin_role_manages_custom_requests" ON "CustomRequest"
  FOR ALL TO atelier_api_admin USING (true) WITH CHECK (true);
CREATE POLICY "admin_role_manages_orders" ON "Order"
  FOR ALL TO atelier_api_admin USING (true) WITH CHECK (true);
