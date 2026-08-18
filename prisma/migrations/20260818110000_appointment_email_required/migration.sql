-- Swap which contact field an appointment requires.
--
-- Appointment was the only one of the three request types keyed on a phone
-- number: Enquiry and CustomRequest both already required an email and left
-- the phone optional. That inconsistency meant a fitting request - the one
-- submission that most needs a confirmation and a reminder, because a no-show
-- costs the shop a slot - was also the one with no guaranteed address to send
-- either to.
--
-- Safe to apply: the table held zero rows when this was written, so the
-- SET NOT NULL cannot fail on existing data. Were that not true, this would
-- need a backfill first; a NOT NULL against a table with a single NULL email
-- aborts the whole migration.
--
-- Column-level grants are untouched. Nullability is not a privilege, and the
-- public role already holds INSERT on both columns.
ALTER TABLE "Appointment" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "Appointment" ALTER COLUMN "phone" DROP NOT NULL;
