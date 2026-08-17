-- Snapshot the customer's email on the order, so a "your garment is ready"
-- message can be sent without following a relation that may have been set
-- null. Additive and nullable: safe to apply to a live database, and every
-- existing row keeps working with the column empty.
ALTER TABLE "Order" ADD COLUMN "customerEmail" TEXT;
