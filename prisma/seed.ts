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
// If you edit these, keep that discipline: rewrite the voice, never the
// facts. Anything still marked unconfirmed in docs/business-requirements.md
// must stay unconfirmed here.
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
      "Measurements are taken in person, at a fitting. We do not offer a self-measurement guide yet, so this part happens face to face for now. Book a fitting and we will walk you through it ourselves, one measurement at a time.",
    sortOrder: 2,
  },
  {
    id: "deposit-and-payment",
    category: "Pricing & Deposits",
    question: "Do I need to pay a deposit, and what payment methods do you accept?",
    answer:
      "We are still settling our deposit and the payment methods we will accept, so we would rather tell you directly than post something here we might have to change next month. Ask us before you place an order, and please treat nothing on this page as final pricing policy.",
    sortOrder: 3,
  },
  {
    id: "alterations-policy",
    category: "Measurements & Fit",
    question: "What if the fit isn't right when the garment is ready?",
    answer:
      "Our written alterations policy is not finished yet, though the short version is simpler than a policy anyway. If the fit is not right, come back and tell us. A garment that does not sit properly is not finished work. The full details will follow once they are settled.",
    sortOrder: 4,
  },
] as const;

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  await prisma.shopSettings.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: {
      id: SINGLETON_ID,
      shopName: "Atelier Haute",
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

  await prisma.$disconnect();
  console.log("ShopSettings and FAQs seeded.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
