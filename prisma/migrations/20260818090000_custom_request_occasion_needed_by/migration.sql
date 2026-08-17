-- The two questions a tailor asks first, captured as data rather than buried
-- in the description paragraph. Both nullable and additive: safe on a live
-- database, and every existing row keeps working.
ALTER TABLE "CustomRequest" ADD COLUMN "occasion" TEXT;
ALTER TABLE "CustomRequest" ADD COLUMN "neededBy" DATE;
