-- Snapshot the customer's email on the order, so a "your garment is ready"
-- message can be sent without following a relation that may have been set
-- null. Additive and nullable: safe to apply to a live database, and every
-- existing row keeps working with the column empty.
ALTER TABLE "Order" ADD COLUMN "customerEmail" TEXT;

-- And allow the phone to be absent. A custom request carries an optional phone
-- and a required email; the NOT NULL here is what forced the admin screen to
-- write an email address into the phone column. At least one contact field is
-- required, enforced above the database.
ALTER TABLE "Order" ALTER COLUMN "customerPhone" DROP NOT NULL;
