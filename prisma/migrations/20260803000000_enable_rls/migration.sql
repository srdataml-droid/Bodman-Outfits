-- Row Level Security, and closing a live public exposure.
--
-- BACKGROUND (measured, not assumed, on 2026-08-03):
--   * Every table in `public` had RLS disabled and ZERO policies.
--   * Supabase's `anon` and `authenticated` roles held
--     SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER on
--     every table, including "Admin" (bcrypt password hashes),
--     "AdminSession" (session token hashes), and "Appointment"/"Enquiry"
--     (customer names, phone numbers, email addresses, free-text messages).
--   * This project's PostgREST endpoint is live and reachable from the
--     public internet (verified: it answers 401 without an API key).
--   * Neither `anon` nor `authenticated` has BYPASSRLS.
--
-- The Supabase anon key is designed to be public and is routinely embedded
-- in client bundles. With those grants and no RLS, anyone holding it could
-- have read every admin password hash and every customer record, and could
-- have issued DELETE or TRUNCATE, without ever touching this application.
-- That is the exposure this migration closes.
--
-- Nothing in this application uses PostgREST. `apps/api` connects directly
-- over Postgres via Prisma. So `anon` and `authenticated` need no access to
-- these tables at all, and the correct fix is to take it away rather than to
-- write permissive policies for them.

-- ---------------------------------------------------------------------------
-- 1. Remove the standing grants.
-- ---------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- `service_role` is deliberately left alone. It already carries BYPASSRLS,
-- its key is a server-side secret rather than a public one, and Supabase
-- internals rely on it. Revoking it would break platform features without
-- closing the hole that actually matters.

-- ---------------------------------------------------------------------------
-- 2. Stop the grants coming back.
--
-- Supabase sets DEFAULT PRIVILEGES on the public schema, so every table a
-- future Prisma migration creates would be granted to anon and authenticated
-- all over again. Without this block, the next `CREATE TABLE` silently
-- reopens exactly the hole closed above.
-- ---------------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM authenticated;

-- The same defaults are also attached to the `postgres` role as grantor,
-- which is the one Prisma migrations run as, so revoke there too.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;

-- ---------------------------------------------------------------------------
-- 3. Enable RLS as a second, independent layer.
--
-- FORCE is used as well as ENABLE so that the table owner is also subject to
-- policy. Note this does NOT currently constrain `apps/api`: it connects as
-- `postgres`, which holds BYPASSRLS, and BYPASSRLS overrides FORCE. See the
-- "single database role" limitation documented in docs/architecture.md.
-- FORCE is set anyway so the protection is already correct the moment the
-- application moves to a non-bypassing role.
-- ---------------------------------------------------------------------------
ALTER TABLE "ShopSettings"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopSettings"  FORCE ROW LEVEL SECURITY;
ALTER TABLE "Faq"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Faq"           FORCE ROW LEVEL SECURITY;
ALTER TABLE "Appointment"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment"   FORCE ROW LEVEL SECURITY;
ALTER TABLE "Enquiry"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enquiry"       FORCE ROW LEVEL SECURITY;
ALTER TABLE "Admin"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Admin"         FORCE ROW LEVEL SECURITY;
ALTER TABLE "AdminSession"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminSession"  FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. Policies, expressing the access patterns the API genuinely exposes.
--
-- Policies are intentionally written without a TO clause so they apply to
-- every non-bypassing role, including the scoped application role proposed
-- in docs/architecture.md, which does not exist yet and therefore cannot be
-- named here.
--
-- Deny-by-default does the heavy lifting: any table/command combination
-- without a policy below is denied outright. "Admin" and "AdminSession"
-- deliberately get NO policies at all. Nothing outside a BYPASSRLS
-- connection should ever read a password hash or a session token, so there
-- is no legitimate pattern to express.
-- ---------------------------------------------------------------------------

-- Public display content: the API serves both of these to anonymous visitors.
CREATE POLICY "shop_settings_public_read" ON "ShopSettings"
  FOR SELECT USING (true);

CREATE POLICY "faq_public_read" ON "Faq"
  FOR SELECT USING (true);

-- Public submissions: customers have no accounts, so these two are written
-- by unauthenticated visitors through the API. Insert only. Reading them
-- back is an admin function and gets no policy here, because appointment and
-- enquiry rows contain customer personal data.
CREATE POLICY "appointment_public_insert" ON "Appointment"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "enquiry_public_insert" ON "Enquiry"
  FOR INSERT WITH CHECK (true);
