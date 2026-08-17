import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Fixed singleton row id — see SINGLETON_ID in
// apps/api/src/shop-settings/shop-settings.service.ts. Must match.
const SINGLETON_ID = "singleton";

// Migrated verbatim from apps/web/lib/faq-data.ts (the previous
// hard-coded source) — content unchanged, just moved. Each answer already
// states plainly where a policy is still pending owner confirmation; see
// docs/business-requirements.md — FAQ Content. Explicit ids match the
// original file's ids for continuity, and make this seed idempotent via
// upsert (safe to re-run) even though the schema's default id generation
// is normal cuid(), not a fixed key — this is just seed data supplying
// its own known values, same as any reference data would.
// Copy rewritten 2026-08-02 for voice. THE FACTS ARE UNCHANGED: every answer
// states exactly what it stated before, including which policies are still
// unsettled. Nothing gained a timeframe, a price, a percentage, or a
// commitment that was not already there. Only the voice changed, from flat
// placeholder phrasing to something closer to a craftsperson explaining their
// own process. Em-dashes removed throughout at the owner's instruction (three
// of the four previous answers used one).
//
// Revised 2026-08-04 at the owner's instruction: the page no longer tells
// customers that policies are still being decided, because the admin app is
// where policies get written and published. The deposit and alterations
// answers dropped that framing. Note what did NOT happen: neither answer
// gained a deposit amount, a payment method, or an alterations guarantee.
// They now point the reader at a conversation instead of announcing an
// unfinished policy, which is a change of framing, not of fact.
//
// Revised again 2026-08-04: the owner CONFIRMED two policies that had been
// deliberately vague until now, so the deposit answer states 60% before work
// starts and refundable, and the alterations answer states that alterations
// after delivery are free. These are stated because they are confirmed, not
// because the vagueness was uncomfortable. Payment METHODS remain unconfirmed
// and the deposit answer still declines to name any.
//
// If you edit these, keep that discipline: rewrite the voice, never the
// facts. Do not add a policy detail here that the owner has not confirmed.
//
// AND: this seed upserts with `update: {}`, so editing a string above does
// NOTHING to a database that already has the row. Every change here must be
// applied to the live rows separately.
const FAQ_SEED_DATA = [
  {
    id: "turnaround-time",
    category: "Timelines",
    question: "How long does an order take?",
    answer:
      "Every piece moves at its own pace. Something with real structure asks for more time at the bench than something simple, and how full the workroom is that week changes things too. That is why we have not put a single number on the wall. It would be honest for one garment and misleading for the next. Tell us what you have in mind and we will give you a realistic estimate for that piece, before you commit to anything.",
    sortOrder: 1,
  },
  {
    id: "how-measurements-work",
    category: "Measurements & Fit",
    question: "How do measurements work?",
    answer:
      "Measurements are taken in person, at a fitting. Bespoke begins from a body rather than a size chart, so this part happens face to face and we would not want it any other way. Book a fitting and we will walk you through it ourselves, one measurement at a time.",
    sortOrder: 2,
  },
  {
    id: "deposit-and-payment",
    category: "Pricing & Deposits",
    question: "Do I need to pay a deposit, and what payment methods do you accept?",
    answer:
      "Yes. We ask for 60% of the price before work starts, and that deposit is refundable. The balance is settled when the piece is ready. As for how you pay, talk to us and we will find the method that suits you best. It is a short conversation rather than paperwork.",
    sortOrder: 3,
  },
  {
    id: "alterations-policy",
    category: "Measurements & Fit",
    question: "What if the fit isn't right when the garment is ready?",
    answer:
      "Come back and tell us. A garment that does not sit properly is not finished work, so we will put it right, and alterations after delivery are free. That is the whole of it.",
    sortOrder: 4,
  },
  {
    id: "individual-pieces",
    category: "Ordering",
    question: "Can you make just a shirt, or just trousers, on their own?",
    answer:
      "Yes. The catalogue is organised around suits and complete outfits because that is how most people order, and the casuals and corporate prices cover a shirt and trousers together. That is how the listing is arranged, not a limit on what we make. A single shirt, one pair of trousers, or something not shown at all is ordinary work here. Ask us rather than assuming it is off the table.",
    sortOrder: 5,
  },
] as const;

/**
 * The five catalogue garments, migrated out of apps/web/lib/garments.ts.
 *
 * These are the EXISTING confirmed pieces copied across verbatim, not new
 * product. Agbada and kaftan appear nowhere here because they have no
 * individual garments — they are categories with no pieces described, and
 * inventing rows for them would be inventing product.
 *
 * `startingPrice` is null on every row on purpose: the five confirmed prices
 * are per category, and a per-garment figure would be an invented fact that
 * could silently drift from the line price.
 */
/*
 * EMPTY ON PURPOSE, 2026-08-17.
 *
 * This list previously held five garments whose imagery was AI-generated to
 * fill the page while the site was being built. Shipped as-is that is a shop
 * advertising clothes it does not make: a customer choosing a "Navy Two-Piece"
 * from a picture would be choosing something that has never existed, and the
 * first fitting would be the moment everyone found out.
 *
 * The rows were deactivated in the database and the imagery deleted from the
 * repository rather than left dormant, because a placeholder that looks
 * finished is the kind that ships.
 *
 * Real pieces go here - or better, get added through the admin screen, which
 * already handles name, description, both images, a starting price and the
 * active flag. An empty catalogue is not a gap to be filled with something
 * plausible; the category pages already say the honest thing, that these
 * lines are cut to the person and begin with a conversation.
 */
const GARMENT_SEED_DATA: ReadonlyArray<{
  slug: string;
  category: string;
  name: string;
  detail: string;
  description: string;
  imageFlat: string;
  imageOnForm: string;
  altFlat: string;
  altOnForm: string;
  sortOrder: number;
}> = [];

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  await prisma.shopSettings.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: {
      id: SINGLETON_ID,
      shopName: "Bodman Outfits",
      tagline: "Redefining modern sartorial heritage from the heart of Lagos.",
      // Confirmed per docs/business-requirements.md — Customer WhatsApp Contact.
      whatsappNumber: "+234 706 131 3517",
      cityCountry: "Lagos, Nigeria",
      // Everything below is unconfirmed per docs/business-requirements.md
      // (shop address/hours, pricing/deposit) and is seeded empty/zero
      // rather than with an invented value. depositPercentage: 0 is a
      // schema-required placeholder, not a confirmed "no deposit" policy —
      // do not surface it as real policy until the owner confirms it.
      phone: "",
      email: "",
      address: "",
      hoursWeekday: "",
      hoursSaturday: "",
      hoursSunday: "",
      pricingNote: "",
      depositPercentage: 0,
    },
  });

  for (const faq of FAQ_SEED_DATA) {
    await prisma.faq.upsert({
      where: { id: faq.id },
      update: {},
      create: faq,
    });
  }

  // Unlike the FAQ upsert above, this one DOES write on conflict. Garment
  // copy lives in this file until an admin edits it, so re-running the seed
  // should restore the seeded text rather than quietly do nothing. Anything
  // the admin has since changed in the dashboard will be overwritten by a
  // re-run — that is the trade, and it is why this is a seed and not a sync.
  for (const garment of GARMENT_SEED_DATA) {
    await prisma.garment.upsert({
      where: { category_slug: { category: garment.category, slug: garment.slug } },
      update: garment,
      create: garment,
    });
  }

  await prisma.$disconnect();
  console.log("ShopSettings, FAQs and Garments seeded.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
