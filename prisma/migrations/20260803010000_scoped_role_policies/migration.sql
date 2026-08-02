-- Policies and grants for the scoped application roles.
--
-- The previous migration (20260803000000_enable_rls) enabled and FORCEd RLS
-- and wrote policies without a TO clause, because the application roles did
-- not exist yet and a policy cannot name a role that is absent. Those roles
-- now exist, so policies can be attached to them by name, which is both more
-- precise and self-documenting.
--
-- Two problems from the first cut are fixed here, both found by running the
-- application against the scoped roles rather than by inspection:
--
--   1. `Admin` and `AdminSession` were deliberately given NO policies, on the
--      reasoning that nothing outside a BYPASSRLS connection should read a
--      password hash. That was correct while the app connected as `postgres`,
--      and wrong the moment it stopped. `atelier_api_admin` is now the role
--      that performs login, so it needs to read `Admin`. Note the failure was
--      silent: under RLS a SELECT with no matching policy returns zero rows
--      rather than raising, so login simply behaved as "no such account".
--
--   2. The content tables had only an INSERT policy for public submissions,
--      so the admin surface could not read back the rows it is supposed to
--      manage. Same silent-empty-result failure mode.

-- ---------------------------------------------------------------------------
-- Admin surface: `atelier_api_admin` runs the authenticated application.
-- ---------------------------------------------------------------------------
CREATE POLICY "admin_role_manages_shop_settings" ON "ShopSettings"
  FOR ALL TO atelier_api_admin USING (true) WITH CHECK (true);

CREATE POLICY "admin_role_manages_faq" ON "Faq"
  FOR ALL TO atelier_api_admin USING (true) WITH CHECK (true);

CREATE POLICY "admin_role_manages_appointments" ON "Appointment"
  FOR ALL TO atelier_api_admin USING (true) WITH CHECK (true);

CREATE POLICY "admin_role_manages_enquiries" ON "Enquiry"
  FOR ALL TO atelier_api_admin USING (true) WITH CHECK (true);

-- Login reads the account; password and email changes update it. There is
-- deliberately no INSERT or DELETE policy, matching the table grants: the
-- running application must never be able to mint or destroy admin accounts.
-- Creating the first admin is `prisma/bootstrap-admin.ts`, which uses
-- DATABASE_URL, a separate and more privileged connection.
CREATE POLICY "admin_role_reads_admin" ON "Admin"
  FOR SELECT TO atelier_api_admin USING (true);

CREATE POLICY "admin_role_updates_admin" ON "Admin"
  FOR UPDATE TO atelier_api_admin USING (true) WITH CHECK (true);

-- Sessions are created on login, read on every guarded request, and deleted
-- on logout or password change.
CREATE POLICY "admin_role_manages_sessions" ON "AdminSession"
  FOR ALL TO atelier_api_admin USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Public surface: making `INSERT` actually work without granting PII access.
--
-- Prisma's `create()` issues `INSERT ... RETURNING`, so an INSERT privilege
-- alone is not sufficient; the role also needs SELECT on whatever is
-- returned. Granting plain SELECT on these tables would hand the public role
-- read access to customer names, phone numbers, emails and message bodies,
-- which is precisely what this split exists to prevent.
--
-- Instead the grant is COLUMN-LEVEL, covering only the two fields the public
-- API actually returns in its receipt (`id` and `status`), paired with
-- application code that restricts the RETURNING clause to exactly those
-- columns. A leaked public credential can therefore learn that appointments
-- exist and whether they are pending, and nothing about who made them.
-- ---------------------------------------------------------------------------
GRANT SELECT ("id", "status") ON "Appointment" TO atelier_api_public;
GRANT SELECT ("id", "status") ON "Enquiry" TO atelier_api_public;

-- RLS is row-level, not column-level, so a SELECT policy is still required
-- for the RETURNING clause to be evaluated at all. The column grants above
-- are what keep this narrow.
CREATE POLICY "public_role_reads_own_receipt_columns" ON "Appointment"
  FOR SELECT TO atelier_api_public USING (true);

CREATE POLICY "public_role_reads_own_receipt_columns" ON "Enquiry"
  FOR SELECT TO atelier_api_public USING (true);
