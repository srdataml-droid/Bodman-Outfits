-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "cityCountry" TEXT NOT NULL,
    "hoursWeekday" TEXT NOT NULL,
    "hoursSaturday" TEXT NOT NULL,
    "hoursSunday" TEXT NOT NULL,
    "pricingNote" TEXT NOT NULL,
    "depositPercentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);
